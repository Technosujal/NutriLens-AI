import os
import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from google.generativeai import types

from app.config import settings

logger = logging.getLogger("uvicorn.error")

# Flag to ensure configuration happens only once
_gemini_configured = False

def configure_gemini():
    """Initializes the Gemini client if not already done."""
    global _gemini_configured
    if not _gemini_configured:
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                _gemini_configured = True
                logger.info("Gemini configured successfully.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")
        else:
            logger.warning("GEMINI_API_KEY is not set. Gemini integrations will operate in mock mode.")

# Call configuration at module load time
configure_gemini()

MODEL = "gemini-pro"

class GeminiService:
    @staticmethod
    def _is_configured() -> bool:
        """Checks if the Gemini API key is available."""
        return _gemini_configured

    @classmethod
    async def extract_foods_from_text(cls, text: str) -> List[Dict[str, Any]]:
        """
        Uses Gemini to parse natural language describing a meal into a structured list
        of food items and quantities.
        """
        if not cls._is_configured():
            return [{"food": "Unknown Food", "quantity": 1.0, "serving_size": "serving"}]

        prompt = f"""
        You are an expert nutrition assistant. Extract food items, quantities, and estimated serving sizes from the following text log: "{text}".
        Return a valid JSON array of objects.
        Each object in the array must have the following keys:
        - "food": The specific food item name (e.g. "Chapati", "Dal", "Banana")
        - "quantity": The parsed quantity (as a float or int. If undefined, default to 1.0)
        - "serving_size": An estimated description of the serving size (e.g. "1 medium", "1 bowl", "100g", "slices")
        Return only the JSON array, no markdown, no extra text.
        """

        try:
            model = genai.GenerativeModel(MODEL)
            response = model.generate_content(
                contents=prompt,
                generation_config=types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            result = json.loads(response.text)
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and "foods" in result:
                return result["foods"]
            return [result]
        except Exception as e:
            logger.error(f"Gemini text extraction failed: {e}")
            return [{"food": text, "quantity": 1.0, "serving_size": "portion"}]

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
            model = genai.GenerativeModel(MODEL)
            response = model.generate_content(
                contents=prompt,
                generation_config=types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
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
            model = genai.GenerativeModel(MODEL)
            response = model.generate_content(
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ],
                generation_config=types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
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
            model = genai.GenerativeModel(MODEL)
            response = model.generate_content(
                contents=prompt,
                generation_config=types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini recommendation generation failed: {e}")
            # Return a more detailed and appealing mock response on failure
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
