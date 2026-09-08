import json
import logging
import asyncio
import time
from typing import List, Dict, Any, Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import settings

logger = logging.getLogger("uvicorn.error")

# --- Globals ---
# gemini-3.5-flash-lite is fast, current, and quota-efficient
MODEL_NAME = "gemini-3.5-flash-lite"
_is_configured = False

def _configure_client():
    """Configures the Gemini client at module load time."""
    global _is_configured
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _is_configured = True
            logger.info("Gemini client configured successfully.")
        except Exception as e:
            logger.error(f"Failed to configure Gemini client: {e}")
    else:
        logger.warning("GEMINI_API_KEY is not set. Gemini integrations will operate in mock mode.")

_configure_client()


class GeminiService:
    @staticmethod
    def _is_configured() -> bool:
        """Checks if the Gemini client is available."""
        return _is_configured

    @classmethod
    async def _run_async(cls, func, *args, **kwargs):
        """Runs a blocking function in an executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))

    @classmethod
    async def _run_with_retry(cls, func, *args, max_retries: int = 3, **kwargs):
        """
        Runs a blocking Gemini API call with exponential backoff retry on rate-limit errors.
        Retries up to max_retries times on 429 / ResourceExhausted errors.
        """
        for attempt in range(max_retries):
            try:
                return await cls._run_async(func, *args, **kwargs)
            except Exception as e:
                err_str = str(e).lower()
                is_rate_limit = any(kw in err_str for kw in [
                    "429", "resource_exhausted", "resourceexhausted",
                    "quota", "rate limit", "ratelimit"
                ])
                if is_rate_limit and attempt < max_retries - 1:
                    wait = 2 ** attempt  # 1s, 2s, 4s
                    logger.warning(
                        f"Gemini rate limit hit (attempt {attempt + 1}/{max_retries}). "
                        f"Retrying in {wait}s..."
                    )
                    await asyncio.sleep(wait)
                else:
                    raise

    @classmethod
    def _heuristic_parse_foods(cls, text: str) -> List[Dict[str, Any]]:
        """
        Rule-based heuristic parser to extract food items and quantities
        when offline, during rate limit, or as a robust fallback.
        """
        import re
        clean = text.strip()
        # Remove common action prefix words
        clean = re.sub(r'^(?:please\s+)?(?:log|add|i\s+ate|i\s+had|ate|save|track|record|consumed|eaten)\s+', '', clean, flags=re.IGNORECASE)
        # Remove meal suffixes like "for breakfast", "for lunch", "in meal", "as snack"
        clean = re.sub(r'\s+(?:for|in|as|to)\s+(?:breakfast|lunch|dinner|snack|meal|my\s+diet).*$', '', clean, flags=re.IGNORECASE)
        clean = clean.strip()
        if not clean:
            return []

        # Split items by comma or ' and ' or '+'
        raw_parts = re.split(r'[,+]|\band\b', clean, flags=re.IGNORECASE)
        items = []
        for part in raw_parts:
            p = part.strip()
            if not p or len(p) < 2:
                continue
            # Match quantity like "2", "1.5", "1/2", "200g", "1 cup", "2 slices", "1 bowl", "a glass of"
            # Pattern 1: number + unit + name (e.g., "200 g chicken breast", "2 slices whole wheat bread", "1 bowl oatmeal")
            match_unit = re.match(r'^(\d+(?:\.\d+)?)\s*(g|grams?|kg|ml|oz|cups?|bowls?|plates?|slices?|pieces?|glasses?|scoops?|tbsp|tsp|servings?)\s+(?:of\s+)?(.+)$', p, re.IGNORECASE)
            if match_unit:
                qty = float(match_unit.group(1))
                unit = match_unit.group(2)
                food_name = match_unit.group(3).strip()
                items.append({
                    "food": food_name.title(),
                    "quantity": qty,
                    "serving_size": f"1 {unit}"
                })
                continue

            # Pattern 2: simple number + name (e.g., "2 eggs", "1 banana", "3 rotis")
            match_qty = re.match(r'^(\d+(?:\.\d+)?)\s+(.+)$', p, re.IGNORECASE)
            if match_qty:
                qty = float(match_qty.group(1))
                food_name = match_qty.group(2).strip()
                items.append({
                    "food": food_name.title(),
                    "quantity": qty,
                    "serving_size": "1 serving"
                })
                continue

            # Pattern 3: "a/an/one" + name (e.g., "an apple", "a banana", "a bowl of cereal")
            match_article = re.match(r'^(?:a|an|one)\s+(?:(bowl|cup|slice|glass|plate|scoop)\s+of\s+)?(.+)$', p, re.IGNORECASE)
            if match_article:
                unit = match_article.group(1) or "serving"
                food_name = match_article.group(2).strip()
                items.append({
                    "food": food_name.title(),
                    "quantity": 1.0,
                    "serving_size": f"1 {unit}"
                })
                continue

            # Pattern 4: just food name
            items.append({
                "food": p.title(),
                "quantity": 1.0,
                "serving_size": "1 serving"
            })

        return items

    @classmethod
    async def extract_foods_from_text(cls, text: str) -> List[Dict[str, Any]]:
        """
        Uses Gemini to parse natural language describing a meal into a structured list
        of food items and quantities. If the text contains no food (e.g. greetings or chit-chat),
        returns an empty list [].
        """
        clean_text = text.strip()
        if not clean_text:
            return []

        # Common non-food greetings check
        non_foods = {"hi", "hello", "hey", "good morning", "good evening", "good afternoon", "thanks", "thank you", "bye", "test", "testing"}
        if clean_text.lower().rstrip(".!?,") in non_foods:
            return []

        if not cls._is_configured():
            return cls._heuristic_parse_foods(clean_text)

        prompt = f"""
        You are an expert nutrition assistant. Extract food items, quantities, and estimated serving sizes from the following text log: "{clean_text}".
        
        CRITICAL RULES:
        1. If the input is a greeting (e.g. "hi", "hello"), chit-chat, conversational question, random words, or contains NO food/drink items, return an empty JSON array: []
        2. If food or drink items ARE present, return a valid JSON array of objects.
        Each object in the array must have the following keys:
        - "food": The specific food item name (e.g. "Chapati", "Dal", "Banana", "Boiled Egg")
        - "quantity": The parsed quantity (as a float or int. If undefined, default to 1.0)
        - "serving_size": An estimated description of the serving size (e.g. "1 medium", "1 bowl", "100g", "2 slices", "1 glass")
        
        Return only the JSON array, no markdown, no extra text.
        """
        
        try:
            model = genai.GenerativeModel(MODEL_NAME)
            config = GenerationConfig(response_mime_type="application/json")
            
            response = await cls._run_async(model.generate_content, contents=prompt, generation_config=config)
            
            result = json.loads(response.text)
            if isinstance(result, list):
                # Filter out any non-food entries or empty items
                valid_items = [
                    item for item in result 
                    if isinstance(item, dict) and item.get("food") and item.get("food").lower().strip() not in non_foods
                ]
                if valid_items:
                    return valid_items
            elif isinstance(result, dict) and "foods" in result:
                valid_items = [
                    item for item in result["foods"]
                    if isinstance(item, dict) and item.get("food") and item.get("food").lower().strip() not in non_foods
                ]
                if valid_items:
                    return valid_items
            # Fallback heuristic if empty but looks like a food log
            return cls._heuristic_parse_foods(clean_text)
        except Exception as e:
            logger.error(f"Gemini text extraction failed: {e}")
            return cls._heuristic_parse_foods(clean_text)

    @classmethod
    async def estimate_food_nutrition(cls, food_name: str, quantity: float, serving_size: str) -> Dict[str, Any]:
        """
        Gemini nutrition estimator fallback when USDA lookup yields no entries.
        """
        if not cls._is_configured():
            return {
                "calories": 150.0, "protein": 5.0, "carbs": 20.0,
                "fat": 3.0, "fiber": 2.0, "serving_size": 100.0, "serving_unit": "g"
            }

        prompt = f"""
        Estimate the nutritional information for the following food item:
        Food Name: {food_name}
        Quantity: {quantity}
        Serving Size: {serving_size}

        Provide the nutritional content for this entire portion.
        Return a valid JSON object with the following keys:
        - "calories": float (kcal)
        - "protein": float (grams)
        - "carbs": float (grams)
        - "fat": float (grams)
        - "fiber": float (grams)
        - "serving_size": float (estimated numeric weight/volume in grams or ml)
        - "serving_unit": string (e.g. "g", "ml")
        Return only valid JSON, no markdown, no extra text.
        """

        try:
            model = genai.GenerativeModel(MODEL_NAME)
            config = GenerationConfig(response_mime_type="application/json")

            response = await cls._run_async(model.generate_content, contents=prompt, generation_config=config)
            
            data = json.loads(response.text)
            return {
                "calories": float(data.get("calories", 0.0)),
                "protein": float(data.get("protein", 0.0)),
                "carbs": float(data.get("carbs", 0.0)),
                "fat": float(data.get("fat", 0.0)),
                "fiber": float(data.get("fiber", 0.0)),
                "serving_size": float(data.get("serving_size", 100.0)),
                "serving_unit": str(data.get("serving_unit", "g"))
            }
        except Exception as e:
            logger.error(f"Gemini nutritional estimation failed: {e}")
            return {
                "calories": 100.0, "protein": 2.0, "carbs": 15.0,
                "fat": 2.0, "fiber": 1.0, "serving_size": 100.0, "serving_unit": "g"
            }

    @classmethod
    async def estimate_nutritional_values(cls, food_name: str, quantity: float, serving_size: str) -> Dict[str, Any]:
        """Alias for estimate_food_nutrition"""
        return await cls.estimate_food_nutrition(food_name, quantity, serving_size)

    @classmethod
    async def analyze_food_image(cls, image_bytes: bytes, mime_type: str) -> List[Dict[str, Any]]:
        """
        Sends image bytes to Gemini multimodal (Vision) model to detect foods and estimate nutrients.
        """
        if not cls._is_configured():
            return [{
                "food_name": "Detected Salad", "quantity": 1.0, "serving_size": "1 plate",
                "calories": 250.0, "protein": 5.0, "carbs": 15.0, "fat": 18.0, "fiber": 4.0
            }]

        prompt = """
        You are an expert nutrition AI. Analyze this meal image. Identify all visible food items, estimate their portions/serving sizes, and provide nutrition estimations.
        Return a valid JSON array of objects.
        Each object must have these keys:
        - "food_name": Standard name of the food item.
        - "quantity": Estimated portion quantity (e.g. 1.0, 0.5, 2.0).
        - "serving_size": Estimated serving unit/descriptor (e.g. "slice", "cup", "grams", "piece").
        - "calories": Estimated calories for this item portion (in kcal).
        - "protein": Estimated protein in grams.
        - "carbs": Estimated carbohydrates in grams.
        - "fat": Estimated fat in grams.
        - "fiber": Estimated dietary fiber in grams.
        Return only valid JSON array, no markdown, no extra text.
        """
        
        try:
            model = genai.GenerativeModel(MODEL_NAME)
            config = GenerationConfig(response_mime_type="application/json")
            
            image_part = {"mime_type": mime_type, "data": image_bytes}
            
            response = await cls._run_async(model.generate_content, contents=[image_part, prompt], generation_config=config)
            
            result = json.loads(response.text)
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and "foods" in result:
                return result["foods"]
            return [result]
        except Exception as e:
            logger.error(f"Gemini Vision analysis failed: {e}")
            raise Exception(f"Failed to analyze image using Gemini Vision: {str(e)}")

    @classmethod
    async def get_meal_recommendations(
        cls,
        user_name: str, age: int, gender: str, weight: float, target_weight: float,
        weight_goal: str, activity_level: str, calorie_goal: int,
        calories_remaining: float, protein_remaining: float, carbs_remaining: float,
        fat_remaining: float, diet_preference: str, previous_meals_today: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates tailored meal recommendations for the remainder of the day.
        Uses user details and daily progress to recommend tailored meals.
        """
        if not cls._is_configured():
            return {
                "breakfast": {
                    "meal_name": "Oatmeal with berries and chia seeds",
                    "description": "High fiber oatmeal topped with fresh blueberries and chia seeds.",
                    "calories": 320, "protein": 10, "carbs": 55, "fat": 6, "is_suggestion": True,
                    "explanation": "A great source of complex carbs and fiber to start your day with sustained energy."
                },
                "lunch": {
                    "meal_name": "Grilled Chicken/Tofu Salad",
                    "description": "Grilled protein on a bed of mixed greens with light vinaigrette.",
                    "calories": 400, "protein": 35, "carbs": 12, "fat": 15, "is_suggestion": True,
                    "explanation": "A light yet filling lunch, packed with lean protein to help you meet your daily goal."
                },
                "dinner": {
                    "meal_name": "Baked Salmon with Quinoa and Broccoli",
                    "description": "Baked salmon filet with quinoa and steamed broccoli.",
                    "calories": 480, "protein": 38, "carbs": 35, "fat": 18, "is_suggestion": True,
                    "explanation": "A well-balanced dinner rich in omega-3 fatty acids, fiber, and complete proteins."
                },
                "snacks": {
                    "meal_name": "Greek Yogurt with Almonds",
                    "description": "One cup of unsweetened nonfat Greek yogurt with almonds.",
                    "calories": 180, "protein": 18, "carbs": 8, "fat": 7, "is_suggestion": True,
                    "explanation": "A high-protein snack to curb hunger and keep you on track with your macros."
                }
            }

        diet_instruction = f"The user's dietary preference is **{diet_preference}**. All suggestions must strictly adhere to this."
        if diet_preference.lower() == 'non-vegetarian':
            diet_instruction = (
                f"The user's dietary preference is **{diet_preference}**. "
                "You should primarily suggest non-vegetarian meals, but feel free to include some vegetarian options for variety and balance."
            )

        prompt = f"""
        You are an expert AI Nutritionist. Your task is to generate personalized meal recommendations for a user for the rest of their day.

        **User's Profile & Goals:**
        - Name: {user_name}
        - Age: {age}, Gender: {gender}
        - Current Weight: {weight} kg, Target Weight: {target_weight} kg
        - Primary Goal: {weight_goal}
        - Activity Level: {activity_level}
        - Dietary Preference: {diet_preference}

        **Today's Remaining Nutrition Budget:**
        - Calories: {calories_remaining:.1f} kcal
        - Protein: {protein_remaining:.1f} g
        - Carbs: {carbs_remaining:.1f} g
        - Fat: {fat_remaining:.1f} g

        **Meals Already Logged Today:**
        {json.dumps(previous_meals_today) if previous_meals_today else "None so far."}

        **Your Task:**
        Generate a JSON object with meal suggestions for **Breakfast, Lunch, Dinner, and Snacks**.
        The suggestions must be healthy and **strictly fit within their remaining nutritional budget**.
        {diet_instruction} For each meal type, provide a specific meal idea with its estimated nutritional content and a brief explanation of why it's a good choice.

        **Output Format (Strict JSON):**
        Return ONLY a valid JSON object. Do not include any markdown formatting or extra text.
        The structure must be:
        {{
          "breakfast": {{
            "meal_name": "...",
            "description": "...",
            "calories": <float>, "protein": <float>, "carbs": <float>, "fat": <float>,
            "is_suggestion": true,
            "explanation": "..."
          }},
          "lunch": {{ ... }},
          "dinner": {{ ... }},
          "snacks": {{ ... }}
        }}
        """

        try:
            model = genai.GenerativeModel(MODEL_NAME)
            config = GenerationConfig(response_mime_type="application/json")
            
            response = await cls._run_async(model.generate_content, contents=prompt, generation_config=config)
            
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini recommendation generation failed: {e}")
            if diet_preference.lower() == 'vegetarian':
                return {
                    "breakfast": {
                        "meal_name": "Tofu & Spinach Scramble with Toast",
                        "description": "Crumbled firm tofu scrambled with fresh spinach, turmeric, and whole wheat toast.",
                        "calories": 320, "protein": 22, "carbs": 24, "fat": 12, "is_suggestion": True,
                        "explanation": "100% plant-based high-protein breakfast to boost metabolism cleanly."
                    },
                    "lunch": {
                        "meal_name": "Quinoa & Chickpea Power Bowl",
                        "description": "Vibrant bowl of fluffy quinoa, spiced chickpeas, cucumber, cherry tomatoes, and tahini.",
                        "calories": 420, "protein": 18, "carbs": 58, "fat": 14, "is_suggestion": True,
                        "explanation": "Balanced vegetarian power bowl rich in complex carbs and fiber."
                    },
                    "dinner": {
                        "meal_name": "Grilled Paneer & Roasted Vegetables",
                        "description": "Spiced cottage cheese cubes grilled with bell peppers, zucchini, and mint chutney.",
                        "calories": 440, "protein": 26, "carbs": 22, "fat": 20, "is_suggestion": True,
                        "explanation": "High-protein vegetarian dinner to aid overnight muscle recovery."
                    },
                    "snacks": {
                        "meal_name": "Greek Yogurt & Almond Bowl",
                        "description": "Low-fat unsweetened Greek yogurt topped with sliced almonds and blueberries.",
                        "calories": 220, "protein": 16, "carbs": 14, "fat": 8, "is_suggestion": True,
                        "explanation": "Probiotic-rich vegetarian snack to curb hunger between meals."
                    }
                }
            return {
                "breakfast": {
                    "meal_name": "Scrambled Eggs with Spinach",
                    "description": "Two large eggs scrambled with a cup of fresh spinach and a side of whole-wheat toast.",
                    "calories": 350, "protein": 25, "carbs": 20, "fat": 18, "is_suggestion": True,
                    "explanation": "A high-protein start to boost metabolism and keep you full until lunch."
                },
                "lunch": {
                    "meal_name": "Quinoa Bowl with Chickpeas",
                    "description": "A vibrant bowl of cooked quinoa, chickpeas, cucumber, tomatoes, and a lemon-tahini dressing.",
                    "calories": 450, "protein": 15, "carbs": 60, "fat": 18, "is_suggestion": True,
                    "explanation": "A balanced, plant-based lunch packed with fiber and complex carbs for sustained energy."
                },
                "dinner": {
                    "meal_name": "Sheet-Pan Lemon Herb Chicken",
                    "description": "Chicken breast baked with broccoli, bell peppers, and zucchini, seasoned with lemon and herbs.",
                    "calories": 480, "protein": 40, "carbs": 25, "fat": 22, "is_suggestion": True,
                    "explanation": "A simple, delicious, and protein-rich dinner that's easy to clean up."
                },
                "snacks": {
                    "meal_name": "Apple Slices with Peanut Butter",
                    "description": "One medium apple sliced with two tablespoons of natural peanut butter.",
                    "calories": 280, "protein": 8, "carbs": 30, "fat": 16, "is_suggestion": True,
                    "explanation": "A perfect snack combining fiber from the apple and healthy fats from peanut butter to satisfy cravings."
                }
            }

    @classmethod
    async def generate_coaching_response(
        cls,
        query: str,
        context_chunks: List[Dict[str, Any]],
        user_name: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generates a personalized AI coaching response by sending the user's query,
        conversation history, and RAG-retrieved context chunks to Gemini.
        """
        # Build a readable context block from retrieved chunks
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            source = chunk.get("source", "Unknown")
            content = chunk.get("content", "")
            score = chunk.get("score", 0.0)
            context_parts.append(f"[Source {i} — {source} (relevance: {score:.0%})]:\n{content}")

        context_block = "\n\n".join(context_parts) if context_parts else "No specific context retrieved."

        system_prompt = f"""You are CalorieAI, a smart, concise, and helpful personal health and nutrition assistant. 
You are chatting with {user_name}.

You have access to the user's database records (logged meals, hydration, weight history, fitness targets) and nutrition guides.

RULES:
1. **Answer directly and concisely**: Give a focused, relevant response answering ONLY what the user specifically asked. Do not add unsolicited tips, random nutrition lectures, or filler.
2. **Only reference personal logs when relevant**: Only mention the user's specific logged meals, weights, or water if their question specifically asks about their progress, history, remaining budget, or stats. If they ask a general question or a conversational question (e.g., "can you log a meal for me", "hi", "how are you"), answer directly without reciting their past meals.
3. **No forced extra sections**: Do NOT append "Suggested Next Steps", unasked tips, or unrelated bullet points unless the user explicitly requested suggestions or advice.
4. **Tone**: Direct, polite, and natural. Use clear markdown formatting when listing data.
5. **No false confirmation**: Do not pretend or falsely state that you saved a meal or water unless answering what was asked. If the user asks you to log a meal, ask what they ate.

--- RETRIEVED USER DATA & NUTRITION CONTEXT ---
{context_block}
--- END RETRIEVED CONTEXT ---"""

        # If Gemini is not configured, fall back to a structured template response
        if not cls._is_configured():
            logger.warning("Gemini not configured — returning template coaching response.")
            return (
                f"## Hello, {user_name}! 👋\n\n"
                "I'm your AI Health Coach. Currently operating in local offline mode.\n\n"
                "Here are your key nutrition principles:\n"
                "- Aim for **1.6–2.2g of protein per kg** of body weight daily.\n"
                "- Drink at least **2.5–3 liters of water** daily.\n"
                "- Log all meals consistently for maximum tracking accuracy."
            )

        try:
            model = genai.GenerativeModel(
                model_name=MODEL_NAME,
                system_instruction=system_prompt
            )

            # Build history for multi-turn conversational context
            formatted_history = []
            if chat_history and len(chat_history) > 0:
                for turn in chat_history[-8:]:
                    role = "user" if turn.get("role") in ["user", "human"] else "model"
                    content = str(turn.get("content", ""))
                    if content.strip():
                        formatted_history.append({"role": role, "parts": [content]})

            chat = model.start_chat(history=formatted_history)
            response = await cls._run_with_retry(
                chat.send_message,
                query
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini coaching response generation failed after retries: {e}")
            return cls._build_local_fallback_response(user_name, query, context_chunks)

    @classmethod
    def _build_local_fallback_response(cls, user_name: str, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Builds a well-formatted fallback response directly from the RAG context chunks
        when the Gemini API is unavailable (e.g., quota exhausted).
        """
        profile_info = ""
        meals = []
        water_logs = []
        weight_logs = []
        guides = []

        for chunk in context_chunks:
            ctype = chunk.get("type", "")
            content = chunk.get("content", "")
            source = chunk.get("source", "")
            if "profile" in ctype:
                profile_info = content
            elif "meal" in ctype:
                meals.append((source, content))
            elif "water" in ctype:
                water_logs.append((source, content))
            elif "weight" in ctype:
                weight_logs.append((source, content))
            else:
                guides.append((source, content))

        lines = [
            f"## Hey {user_name}! 👋 Here's what your logs say:",
            ""
        ]

        if profile_info:
            clean = (
                profile_info
                .replace("User Profile Goal. ", "")
                .replace("User Name: ", "**Name:** ")
                .replace(". Age", "\n**Age**")
                .replace(". Gender", "\n**Gender**")
                .replace(". Weight", "\n**Weight**")
            )
            lines += ["### 👤 Your Profile", clean, ""]

        if meals:
            lines.append("### 🍽️ Recent Meals")
            for source, content in meals[:5]:
                # Strip the verbose prefix and show cleanly
                clean = content.replace("Meal History. ", "")
                lines.append(f"- {clean}")
            lines.append("")

        if weight_logs:
            lines.append("### ⚖️ Weight History")
            for source, content in weight_logs[:3]:
                clean = content.replace("Body Weight History. ", "")
                lines.append(f"- {clean}")
            lines.append("")

        if water_logs:
            lines.append("### 💧 Hydration Logs")
            for source, content in water_logs[:3]:
                clean = content.replace("Hydration History. ", "")
                lines.append(f"- {clean}")
            lines.append("")

        if guides:
            lines.append("### 📖 Relevant Guidelines")
            for source, content in guides[:2]:
                # Extract just the content portion after 'Content:'
                if "Content:" in content:
                    guide_text = content.split("Content:", 1)[1].strip()
                    title = source.replace("Guide: ", "")
                    lines.append(f"**{title}:** {guide_text[:300]}{'…' if len(guide_text) > 300 else ''}")
                else:
                    lines.append(f"- {content[:250]}")
            lines.append("")

        if not (meals or weight_logs or water_logs or guides or profile_info):
            lines += [
                "I couldn't find any logged data to answer your question yet.",
                "Start by logging some meals and tracking your water intake on the Dashboard!"
            ]

        lines.append("---")
        lines.append("*⚡ AI quota temporarily exhausted — showing your data directly from logs. Try again in a few minutes for a full AI analysis.*")
        return "\n".join(lines)
