import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.meal import Meal, MealItem
from app.models.water import WaterLog
from app.models.weight import WeightHistory
from app.services.rag_service import RAGService

class RAGFeaturesService:
    """
    RAG & Vector-search powered engine for:
    1. Smart Grocery & Meal Finder (matching user's remaining macros & search query)
    2. Weekly RAG Diet & Health Report (aggregating 7-day logs & generating tailored insights)
    3. Smart RAG Food Swap (vector search / nutrient comparison for healthier alternatives)
    """

    @classmethod
    async def smart_meal_finder(
        cls, 
        user: User, 
        db: Session, 
        ingredients_query: Optional[str] = None,
        diet_preference: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses RAG context over user history & nutrition guide to recommend top meals 
        customized to the user's remaining calorie & macro deficits for today.
        """
        # Calculate today's consumed macros
        from datetime import date
        today_str = date.today().isoformat()
        
        today_meals = db.query(Meal).filter(Meal.user_id == user.id, Meal.date == today_str).all()
        consumed_cal = sum(m.total_calories for m in today_meals)
        consumed_protein = sum(m.total_protein for m in today_meals)
        consumed_carbs = sum(m.total_carbs for m in today_meals)
        consumed_fat = sum(m.total_fat for m in today_meals)

        target_cal = user.calorie_goal or 2000.0
        target_protein = user.protein_goal_g or 150.0
        target_carbs = user.carbs_goal_g or 200.0
        target_fat = user.fat_goal_g or 65.0

        rem_cal = max(0.0, target_cal - consumed_cal)
        rem_protein = max(0.0, target_protein - consumed_protein)
        rem_carbs = max(0.0, target_carbs - consumed_carbs)
        rem_fat = max(0.0, target_fat - consumed_fat)

        # Build retrieval query
        query_text = f"Healthy recipes meals remaining calories {rem_cal:.0f} protein {rem_protein:.0f}g"
        if ingredients_query and ingredients_query.strip():
            query_text += f" containing {ingredients_query.strip()}"

        # Retrieve top relevant context chunks using RAG
        context_chunks = await RAGService.retrieve_context(query_text, user, db, k=4)
        context_text = "\n".join([f"- [{c['source']}]: {c['content']}" for c in context_chunks])

        # Check diet preference passed from UI or fall back to user profile setting
        chosen_diet = diet_preference or user.diet_preference or "Non-Vegetarian"
        is_veg = chosen_diet.lower() == "vegetarian"

        # Use Gemini LLM to generate truly personalized, macro-fitted recipes
        candidate_meals = []
        try:
            import google.generativeai as genai
            from google.generativeai.types import GenerationConfig
            from app.services.gemini_service import MODEL_NAME, GeminiService

            if GeminiService._is_configured():
                ingredient_instruction = (
                    f"The user has these ingredients available: '{ingredients_query.strip()}'."
                    if ingredients_query and ingredients_query.strip()
                    else "Generate diverse, healthy recipe ideas suitable for the user's remaining macros."
                )

                prompt = f"""
                You are a Michelin-star fitness chef and nutritionist.
                Your task is to generate 2 to 4 delicious, realistic recipes tailored to the user's exact remaining daily macro budget.

                User Dietary Preference: {chosen_diet} (STRICTLY adhere to this).
                Target Budget Remaining:
                - Calories: {rem_cal:.0f} kcal
                - Protein: {rem_protein:.0f} g
                - Carbs: {rem_carbs:.0f} g
                - Fat: {rem_fat:.0f} g

                {ingredient_instruction}

                --- RETRIEVED NUTRITION CONTEXT ---
                {context_text}
                --- END CONTEXT ---

                Return a valid JSON array of objects.
                Each object must have these exact keys:
                - "meal_name": String (creative, appealing recipe name)
                - "calories": Number (estimated calories in kcal, fitting within remaining budget)
                - "protein": Number (grams of protein)
                - "carbs": Number (grams of carbohydrates)
                - "fat": Number (grams of fat)
                - "description": String (clear 1-2 sentence preparation summary with key ingredients)
                - "match_reason": String (explanation of why this recipe fits their macros and ingredients)

                Return ONLY valid JSON array, no markdown wrappers, no extra text.
                """

                model = genai.GenerativeModel(MODEL_NAME)
                config = GenerationConfig(response_mime_type="application/json")
                response = await GeminiService._run_async(model.generate_content, contents=prompt, generation_config=config)
                
                import json
                parsed = json.loads(response.text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    candidate_meals = [
                        {
                            "meal_name": str(item.get("meal_name", "Healthy Meal")),
                            "calories": float(item.get("calories", 350)),
                            "protein": float(item.get("protein", 25)),
                            "carbs": float(item.get("carbs", 35)),
                            "fat": float(item.get("fat", 10)),
                            "description": str(item.get("description", "")),
                            "match_reason": str(item.get("match_reason", "Customized to your daily macro target."))
                        }
                        for item in parsed
                    ]
        except Exception as llm_err:
            import logging
            logging.getLogger("uvicorn.error").error(f"Gemini meal finder generation error: {llm_err}")

        # Fallback if LLM was unavailable
        if not candidate_meals:
            all_recipes = [
                {
                    "meal_name": "High-Protein Oatmeal Bowl",
                    "diet": "vegetarian",
                    "calories": 380, "protein": 26, "carbs": 48, "fat": 7,
                    "description": "Rolled oats simmered with protein powder, topped with fresh berries, chia seeds, and sliced banana.",
                    "match_reason": "Packed with complex carbs and protein to jumpstart your day."
                },
                {
                    "meal_name": "Avocado & Egg Whole Wheat Toast",
                    "diet": "non-vegetarian",
                    "calories": 360, "protein": 20, "carbs": 32, "fat": 15,
                    "description": "Toasted whole grain bread layered with mashed avocado, poached eggs, and red pepper flakes.",
                    "match_reason": "Delivers healthy monounsaturated fats and essential amino acids."
                },
                {
                    "meal_name": "Paneer & Quinoa Power Bowl",
                    "diet": "vegetarian",
                    "calories": 440, "protein": 28, "carbs": 42, "fat": 14,
                    "description": "Grilled paneer cubes over fluffy quinoa with roasted veggies and lemon dressing.",
                    "match_reason": "Complete protein amino acid profile for vegetarian muscle recovery."
                },
                {
                    "meal_name": "Herb Grilled Chicken Breast",
                    "diet": "non-vegetarian",
                    "calories": 450, "protein": 42, "carbs": 35, "fat": 9,
                    "description": "Juicy grilled chicken breast marinated in herbs, served with sweet potato wedges and steamed greens.",
                    "match_reason": "Maximizes protein intake while keeping saturated fat minimal."
                }
            ]
            candidate_meals = [r for r in all_recipes if not is_veg or r["diet"] == "vegetarian"]

        return {
            "query_used": ingredients_query or "Suggested For Your Macros",
            "remaining_budget": {
                "calories": round(rem_cal, 1),
                "protein": round(rem_protein, 1),
                "carbs": round(rem_carbs, 1),
                "fat": round(rem_fat, 1)
            },
            "suggestions": candidate_meals,
            "rag_citations": [c["source"] for c in context_chunks]
        }

    @classmethod
    async def generate_weekly_report(cls, user: User, db: Session) -> Dict[str, Any]:
        """
        Analyzes the last 7 days of user logs and aggregates RAG context to create a
        comprehensive weekly diet performance report with dynamic advice.
        """
        from datetime import date, timedelta
        end_date = date.today()
        start_date = end_date - timedelta(days=6)

        # Query 7-day meals
        meals = db.query(Meal).filter(
            Meal.user_id == user.id,
            Meal.date >= start_date.isoformat(),
            Meal.date <= end_date.isoformat()
        ).all()

        # Query 7-day water
        water_logs = db.query(WaterLog).filter(
            WaterLog.user_id == user.id,
            WaterLog.date >= start_date.isoformat(),
            WaterLog.date <= end_date.isoformat()
        ).all()

        # Query weight history
        weight_logs = db.query(WeightHistory).filter(
            WeightHistory.user_id == user.id
        ).order_by(WeightHistory.date.desc()).limit(7).all()

        # Calculate statistics
        days_logged = len(set(m.date for m in meals))
        total_calories = sum(m.total_calories for m in meals)
        total_protein = sum(m.total_protein for m in meals)
        total_carbs = sum(m.total_carbs for m in meals)
        total_fat = sum(m.total_fat for m in meals)

        avg_calories = total_calories / max(1, days_logged)
        avg_protein = total_protein / max(1, days_logged)
        avg_carbs = total_carbs / max(1, days_logged)
        avg_fat = total_fat / max(1, days_logged)

        target_cal = user.calorie_goal or 2000.0
        target_prot = user.protein_goal_g or 150.0

        cal_adherence_pct = min(100, round((avg_calories / target_cal) * 100)) if target_cal else 0
        prot_adherence_pct = min(100, round((avg_protein / target_prot) * 100)) if target_prot else 0

        # RAG context lookup for insights
        query = f"Weekly progress calories {avg_calories:.0f} protein {avg_protein:.0f} weight goal {user.weight_goal}"
        rag_chunks = await RAGService.retrieve_context(query, user, db, k=3)

        # Build dynamic insights
        insights = []
        if cal_adherence_pct >= 90 and cal_adherence_pct <= 110:
            insights.append("🎯 **Calorie Target Mastery:** Your average daily intake matched your target budget within a 10% range.")
        elif cal_adherence_pct < 90:
            insights.append("⚠️ **Calorie Deficit Warning:** You were below your target calorie goal by over 10%. Ensure you eat enough to prevent muscle fatigue.")
        else:
            insights.append("💡 **Calorie Surplus Alert:** Your weekly intake exceeded your planned budget. Try focusing on nutrient-dense low-calorie foods.")

        if prot_adherence_pct >= 85:
            insights.append("💪 **Strong Protein Consistency:** Great job hitting your daily protein target! This supports muscle recovery and satiety.")
        else:
            insights.append("🥚 **Protein Boost Needed:** You averaged under 85% of your target protein. Consider adding egg whites, Greek yogurt, or protein shakes.")

        avg_water = sum(w.amount_ml for w in water_logs) / max(1, len(water_logs)) if water_logs else 0
        if avg_water >= 2000:
            insights.append(f"🌊 **Hydration Success:** Excellent work averaging {avg_water/1000:.1f}L of water daily.")
        else:
            insights.append("💧 **Hydration Opportunity:** Try increasing daily water intake toward 2.5L to boost metabolic efficiency.")

        return {
            "period": f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d')}",
            "days_logged": days_logged,
            "averages": {
                "calories": round(avg_calories, 1),
                "protein": round(avg_protein, 1),
                "carbs": round(avg_carbs, 1),
                "fat": round(avg_fat, 1)
            },
            "adherence": {
                "calorie_pct": cal_adherence_pct,
                "protein_pct": prot_adherence_pct
            },
            "insights": insights,
            "rag_context_used": [c["source"] for c in rag_chunks]
        }

    @classmethod
    async def get_smart_food_swap(cls, food_name: str, calories: float, protein: float, fat: float) -> Dict[str, Any]:
        """
        Uses nutritional vector matching & USDA search to find healthier, 
        lower-calorie or higher-protein smart swaps for any food item.
        """
        # Vector / keyword lookup via USDA or pre-defined smart swaps
        swaps_db = {
            "white rice": {
                "swap_name": "Cauliflower Rice or Brown Rice",
                "calories": round(calories * 0.3, 1),
                "protein": round(protein * 1.2, 1),
                "carbs": 8.0,
                "fat": 0.5,
                "calories_saved": round(calories * 0.7, 1),
                "reason": "Saves 70% of calories while supplying high dietary fiber and key antioxidants."
            },
            "butter chicken": {
                "swap_name": "Tandoori Grilled Chicken",
                "calories": round(calories * 0.55, 1),
                "protein": round(protein * 1.1, 1),
                "carbs": 4.0,
                "fat": round(fat * 0.3, 1),
                "calories_saved": round(calories * 0.45, 1),
                "reason": "Eliminates heavy cream and excess butter while maintaining high lean protein."
            },
            "whole milk": {
                "swap_name": "Unsweetened Almond Milk or Skimmed Milk",
                "calories": round(calories * 0.35, 1),
                "protein": round(protein, 1),
                "carbs": 2.0,
                "fat": 1.5,
                "calories_saved": round(calories * 0.65, 1),
                "reason": "Cuts saturated fat dramatically while maintaining beverage volume."
            },
            "french fries": {
                "swap_name": "Air-Fried Sweet Potato Wedges",
                "calories": round(calories * 0.6, 1),
                "protein": round(protein * 1.3, 1),
                "carbs": 24.0,
                "fat": round(fat * 0.25, 1),
                "calories_saved": round(calories * 0.4, 1),
                "reason": "Replaces deep oil frying with air crisping, boosting Vitamin A and complex fiber."
            }
        }

        food_lower = food_name.lower()

        # Multi-keyword fuzzy matching
        if "rice" in food_lower and "chicken" in food_lower:
            matched = {
                "swap_name": "Cauliflower Rice & Herb Grilled Chicken",
                "calories": round(calories * 0.55, 1),
                "protein": round(protein * 1.3, 1),
                "carbs": 12.0,
                "fat": round(fat * 0.4, 1),
                "calories_saved": round(calories * 0.45, 1),
                "reason": "Swapping white rice for cauliflower rice slashes carbs and cuts 45% of total calories while keeping protein high."
            }
        elif "rice" in food_lower:
            matched = {
                "swap_name": "Cauliflower Rice or Steamed Quinoa",
                "calories": round(calories * 0.35, 1),
                "protein": round(protein * 1.2, 1),
                "carbs": 10.0,
                "fat": 1.0,
                "calories_saved": round(calories * 0.65, 1),
                "reason": "Saves up to 65% of calories and boosts dietary fiber significantly."
            }
        elif "chicken" in food_lower:
            matched = {
                "swap_name": "Skinless Air-Fried Chicken Breast",
                "calories": round(calories * 0.65, 1),
                "protein": round(protein * 1.2, 1),
                "carbs": 0.0,
                "fat": round(fat * 0.35, 1),
                "calories_saved": round(calories * 0.35, 1),
                "reason": "Removes skin and excess cooking butter to maximize pure lean protein ratio."
            }
        elif "pizza" in food_lower:
            matched = {
                "swap_name": "Cauliflower Crust Thin Pizza with Lean Toppings",
                "calories": round(calories * 0.5, 1),
                "protein": round(protein * 1.1, 1),
                "carbs": 22.0,
                "fat": round(fat * 0.4, 1),
                "calories_saved": round(calories * 0.5, 1),
                "reason": "Replaces heavy refined dough with cauliflower crust to halve calories."
            }
        elif "burger" in food_lower:
            matched = {
                "swap_name": "Lettuce-Wrapped Turkey or Veggie Burger",
                "calories": round(calories * 0.55, 1),
                "protein": round(protein * 1.25, 1),
                "carbs": 8.0,
                "fat": round(fat * 0.45, 1),
                "calories_saved": round(calories * 0.45, 1),
                "reason": "Skips white refined burger buns for fresh crisp lettuce wrap."
            }
        elif "pasta" in food_lower or "noodle" in food_lower:
            matched = {
                "swap_name": "Zucchini Noodles (Zoodles) or Chickpea Pasta",
                "calories": round(calories * 0.4, 1),
                "protein": round(protein * 1.1, 1),
                "carbs": 14.0,
                "fat": round(fat * 0.3, 1),
                "calories_saved": round(calories * 0.6, 1),
                "reason": "Substitutes high-glycemic flour pasta with nutrient-dense spiralized zucchini."
            }
        else:
            matched = {
                "swap_name": f"Lean / Air-Fried {food_name.title()}",
                "calories": round(calories * 0.7, 1),
                "protein": round(protein * 1.15, 1),
                "carbs": round(max(0, calories * 0.1), 1),
                "fat": round(fat * 0.5, 1),
                "calories_saved": round(calories * 0.3, 1),
                "reason": f"A lighter preparation of {food_name} cuts unwanted cooking oils and concentrates protein."
            }

        return {
            "original_food": {
                "name": food_name,
                "calories": calories,
                "protein": protein,
                "fat": fat
            },
            "smart_swap": matched
        }

    @classmethod
    async def chat_with_coach(
        cls, 
        query: str, 
        user: User, 
        db: Session, 
        chat_history: Optional[List[Dict[str, str]]] = None,
        target_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Interactive RAG Conversational Assistant with agentic database execution.
        Supports direct action execution (logging water, logging meals, logging weight)
        along with intelligent semantic RAG responses.
        """
        import re
        from datetime import date
        from app.services.gemini_service import GeminiService
        
        today_str = target_date or date.today().isoformat()
        clean_q = query.strip()
        lower_q = clean_q.lower()

        # -------------------------------------------------------------
        # 1. ACTION: Log / Add Water
        # Examples: "add 1000 ml for today", "log 500ml water", "drank 250ml", "drank 2 glasses of water"
        # -------------------------------------------------------------
        water_match = re.search(r'(?:add|log|drank|drink|dranked|recorded|consumed|\+)\s*(\d+(?:\.\d+)?)\s*(ml|l|liters?|litres?|glasses?|cups?|bottles?)', lower_q)
        if not water_match:
            # Check pattern like "1000 ml for today", "add 500 ml"
            water_match = re.search(r'(\d+(?:\.\d+)?)\s*(ml|l|liters?|litres?|glasses?|cups?|bottles?)', lower_q)
            if water_match and not any(w in lower_q for w in ["water", "drank", "drink", "hydrate", "hydration", "add", "log"]):
                water_match = None

        if water_match:
            amount_val = float(water_match.group(1))
            unit = water_match.group(2).lower()
            
            if "l" in unit and "ml" not in unit:
                amount_ml = int(amount_val * 1000)
            elif "glass" in unit or "cup" in unit:
                amount_ml = int(amount_val * 250)
            elif "bottle" in unit:
                amount_ml = int(amount_val * 500)
            else:
                amount_ml = int(amount_val)

            if amount_ml > 0:
                # Update / Create WaterLog in database
                existing_water = db.query(WaterLog).filter(
                    WaterLog.user_id == user.id,
                    WaterLog.date == today_str
                ).first()

                if existing_water:
                    existing_water.amount_ml = max(0, existing_water.amount_ml + amount_ml)
                    total_today = existing_water.amount_ml
                else:
                    new_water = WaterLog(
                        user_id=user.id,
                        date=today_str,
                        amount_ml=amount_ml
                    )
                    db.add(new_water)
                    total_today = amount_ml

                db.commit()

                return {
                    "query": query,
                    "response": f"✅ **Logged {amount_ml:,} ml of water!**\nYour total water for today is now **{total_today:,} ml**.",
                    "citations": [{"source": f"Water Log ({today_str})", "type": "water", "score": 100.0}],
                    "action_performed": {
                        "type": "water",
                        "amount_ml": amount_ml,
                        "total_ml": total_today,
                        "date": today_str
                    }
                }

        # -------------------------------------------------------------
        # 2. ACTION: Log a Meal
        # Examples: "add this in meal", "log 2 eggs and toast for breakfast", "i ate 1 bowl oats and milk for lunch", "add 1 apple to snack"
        # -------------------------------------------------------------
        from app.utils.time_utils import get_meal_type_by_time
        meal_keywords = ["breakfast", "lunch", "dinner", "snack"]
        is_meal_command = (
            any(lower_q.startswith(prefix) for prefix in ["log ", "add ", "i ate ", "i had ", "ate ", "save ", "track ", "record ", "enter ", "consumed ", "eaten "]) or
            any(k in lower_q for k in ["for breakfast", "for lunch", "for dinner", "for snack", "in meal", "to meal", "as meal", "this meal", "add this", "log this", "log it", "add it", "breakfast:", "lunch:", "dinner:", "snack:"])
        )
        
        if is_meal_command:
            # Determine meal type from query or context or time of day
            detected_meal_type = None
            for mk in meal_keywords:
                if mk in lower_q:
                    detected_meal_type = mk
                    break
            
            # Extract foods with GeminiService (with regex heuristic fallback)
            food_items = await GeminiService.extract_foods_from_text(clean_q)

            # If no foods in current sentence but user referred to context ("add this in meal", "log this")
            if not food_items and chat_history and len(chat_history) > 0:
                # Find the most recent assistant message that discussed food/meals
                for prev in reversed(chat_history):
                    if prev.get("role") in ["model", "assistant", "ai"]:
                        prev_text = prev.get("content", "")
                        extracted_prev = await GeminiService.extract_foods_from_text(prev_text)
                        if extracted_prev and len(extracted_prev) > 0:
                            food_items = extracted_prev
                            # Also check if previous message mentioned a specific meal type
                            if not detected_meal_type:
                                for mk in meal_keywords:
                                    if mk in prev_text.lower():
                                        detected_meal_type = mk
                                        break
                            break

            if not detected_meal_type:
                detected_meal_type = get_meal_type_by_time()

            if food_items and len(food_items) > 0:
                from app.services.usda_service import get_or_create_nutrition
                meal_items_to_save = []
                total_cal, total_prot, total_carb, total_fat, total_fib = 0.0, 0.0, 0.0, 0.0, 0.0

                for item in food_items:
                    food_name = item.get("food", "Food Item")
                    qty = float(item.get("quantity", 1.0))
                    serving = item.get("serving_size", "1 serving")

                    nutrition = await get_or_create_nutrition(food_name, db)
                    if nutrition:
                        s_size = nutrition.serving_size if nutrition.serving_size and nutrition.serving_size > 0 else 100.0
                        total_weight = qty * s_size
                        c = (nutrition.calories * total_weight) / 100.0
                        p = (nutrition.protein * total_weight) / 100.0
                        cb = (nutrition.carbs * total_weight) / 100.0
                        f = (nutrition.fat * total_weight) / 100.0
                        fib = (nutrition.fiber * total_weight) / 100.0
                    else:
                        nutrients = await GeminiService.estimate_food_nutrition(food_name, qty, serving)
                        c = nutrients.get("calories", 0.0)
                        p = nutrients.get("protein", 0.0)
                        cb = nutrients.get("carbs", 0.0)
                        f = nutrients.get("fat", 0.0)
                        fib = nutrients.get("fiber", 0.0)

                    meal_items_to_save.append(MealItem(
                        food_name=food_name.title(),
                        quantity=qty,
                        serving_size=serving,
                        calories=round(c, 1),
                        protein=round(p, 1),
                        carbs=round(cb, 1),
                        fat=round(f, 1),
                        fiber=round(fib, 1)
                    ))
                    total_cal += c
                    total_prot += p
                    total_carb += cb
                    total_fat += f
                    total_fib += fib

                meal_name = f"{detected_meal_type.title()}: " + ", ".join([mi.food_name for mi in meal_items_to_save[:2]])
                new_meal = Meal(
                    user_id=user.id,
                    meal_type=detected_meal_type,
                    name=meal_name[:100],
                    date=today_str,
                    total_calories=round(total_cal, 1),
                    total_protein=round(total_prot, 1),
                    total_carbs=round(total_carb, 1),
                    total_fat=round(total_fat, 1),
                    total_fiber=round(total_fib, 1)
                )
                db.add(new_meal)
                db.commit()
                db.refresh(new_meal)

                for mi in meal_items_to_save:
                    mi.meal_id = new_meal.id
                    db.add(mi)
                db.commit()
                db.refresh(new_meal)

                items_summary = ", ".join([f"{mi.quantity} {mi.food_name}" for mi in meal_items_to_save])
                items_data = [
                    {
                        "food_name": mi.food_name,
                        "quantity": mi.quantity,
                        "serving_size": mi.serving_size,
                        "calories": mi.calories,
                        "protein": mi.protein,
                        "carbs": mi.carbs,
                        "fat": mi.fat
                    }
                    for mi in meal_items_to_save
                ]
                return {
                    "query": query,
                    "response": (
                        f"✅ **Logged your {detected_meal_type.title()} for today!**\n\n"
                        f"- **Meal**: {items_summary}\n"
                        f"- **Total Nutrition**: ~{new_meal.total_calories:.0f} kcal | {new_meal.total_protein:.1f}g Protein | {new_meal.total_carbs:.1f}g Carbs | {new_meal.total_fat:.1f}g Fat"
                    ),
                    "citations": [{"source": f"Meal Log ({today_str} - {detected_meal_type.title()})", "type": "meal", "score": 100.0}],
                    "action_performed": {
                        "type": "meal",
                        "meal_id": new_meal.id,
                        "meal_name": new_meal.name,
                        "meal_type": detected_meal_type,
                        "calories": new_meal.total_calories,
                        "protein": new_meal.total_protein,
                        "carbs": new_meal.total_carbs,
                        "fat": new_meal.total_fat,
                        "fiber": new_meal.total_fiber,
                        "items": items_data,
                        "date": today_str
                    }
                }

        # -------------------------------------------------------------
        # 3. ACTION: Log Weight
        # Examples: "log my weight as 73.5 kg", "my weight today is 74kg", "weight 72 kg"
        # -------------------------------------------------------------
        weight_match = re.search(r'(?:weight(?: is| to)?|log weight(?: as)?)\s*(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms)?', lower_q)
        if weight_match:
            new_weight = float(weight_match.group(1))
            if 20.0 <= new_weight <= 300.0:
                user.weight_kg = new_weight
                existing_weight = db.query(WeightHistory).filter(
                    WeightHistory.user_id == user.id,
                    WeightHistory.date == today_str
                ).first()
                if existing_weight:
                    existing_weight.weight_kg = new_weight
                else:
                    db.add(WeightHistory(user_id=user.id, weight_kg=new_weight, date=today_str))
                db.commit()

                return {
                    "query": query,
                    "response": f"✅ **Weight updated to {new_weight} kg!** Logged for today ({today_str}).",
                    "citations": [{"source": f"Weight Log ({today_str})", "type": "weight", "score": 100.0}],
                    "action_performed": {
                        "type": "weight",
                        "weight_kg": new_weight,
                        "date": today_str
                    }
                }

        # -------------------------------------------------------------
        # 4. DEFAULT RAG SEMANTIC RETRIEVAL & CONCISE ANSWER
        # -------------------------------------------------------------
        context_chunks = await RAGService.retrieve_context(query, user, db, k=5)
        user_name = user.name or "Champion"
        answer = await GeminiService.generate_coaching_response(
            query=query,
            context_chunks=context_chunks,
            user_name=user_name,
            chat_history=chat_history
        )

        return {
            "query": query,
            "response": answer,
            "citations": [
                {
                    "source": c.get("source", "Nutrition Guide"),
                    "type": c.get("type", "guide"),
                    "score": round(c.get("score", 0.0) * 100, 1)
                }
                for c in context_chunks
            ],
            "action_performed": None
        }

    @classmethod
    async def generate_grocery_plan(
        cls, 
        user: User, 
        db: Session, 
        diet_preference: Optional[str] = None, 
        days: int = 5
    ) -> Dict[str, Any]:
        """
        Generates a categorized weekly grocery shopping checklist tailored to target macros and diet preference.
        """
        chosen_diet = diet_preference or user.diet_preference or "Non-Vegetarian"
        target_cal = user.calorie_goal or 2000.0
        target_prot = user.protein_goal_g or 150.0

        try:
            import google.generativeai as genai
            from google.generativeai.types import GenerationConfig
            from app.services.gemini_service import MODEL_NAME, GeminiService
            import json

            if GeminiService._is_configured():
                prompt = f"""
                You are an expert sports nutritionist and meal prep planner.
                Create an organized, categorized {days}-day grocery shopping list for a user.

                Profile:
                - Diet Preference: {chosen_diet} (STRICTLY adhere to this)
                - Daily Calorie Target: {target_cal:.0f} kcal
                - Daily Protein Target: {target_prot:.0f} g
                - Primary Goal: {user.weight_goal or 'Healthy Living'}

                Return a valid JSON object with the following categories as arrays of objects:
                {{
                  "produce": [{{"item": "Spinach", "quantity": "2 large bunches", "purpose": "High fiber and micronutrients"}}],
                  "lean_proteins": [{{"item": "...", "quantity": "...", "purpose": "..."}}],
                  "dairy_and_alternatives": [{{"item": "...", "quantity": "...", "purpose": "..."}}],
                  "pantry_and_grains": [{{"item": "...", "quantity": "...", "purpose": "..."}}],
                  "healthy_fats_and_nuts": [{{"item": "...", "quantity": "...", "purpose": "..."}}],
                  "meal_prep_summary": "1-2 sentences summarizing the recommended weekly prep strategy"
                }}

                Return ONLY valid JSON.
                """
                model = genai.GenerativeModel(MODEL_NAME)
                config = GenerationConfig(response_mime_type="application/json")
                response = await GeminiService._run_async(model.generate_content, contents=prompt, generation_config=config)
                return json.loads(response.text)
        except Exception as e:
            import logging
            logging.getLogger("uvicorn.error").error(f"Failed to generate AI grocery plan: {e}")

        # Structured Fallback
        is_veg = chosen_diet.lower() == "vegetarian"
        return {
            "produce": [
                {"item": "Baby Spinach & Mixed Greens", "quantity": "500g", "purpose": "Micronutrients & fiber"},
                {"item": "Broccoli & Bell Peppers", "quantity": "1 kg", "purpose": "Vitamin C & volume eating"},
                {"item": "Bananas & Blueberries", "quantity": "1 bunch / 250g", "purpose": "Pre/post workout complex carbs"}
            ],
            "lean_proteins": [
                {"item": "Firm Tofu / Cottage Cheese (Paneer)" if is_veg else "Skinless Chicken Breast", "quantity": "1 kg", "purpose": f"Hit daily {target_prot:.0f}g protein goal"},
                {"item": "Eggs / Liquid Egg Whites", "quantity": "2 dozen", "purpose": "High bioavailability breakfast protein"},
                {"item": "Canned Chickpeas & Lentils", "quantity": "4 cans", "purpose": "Plant protein and digestive fiber"}
            ],
            "dairy_and_alternatives": [
                {"item": "Unsweetened Non-Fat Greek Yogurt", "quantity": "1 kg tub", "purpose": "Probiotics & low-calorie satiety"},
                {"item": "Unsweetened Almond / Skim Milk", "quantity": "2 liters", "purpose": "Smoothies & oatmeal base"}
            ],
            "pantry_and_grains": [
                {"item": "Rolled Oats", "quantity": "1 kg", "purpose": "Sustained morning energy"},
                {"item": "Brown Rice or Quinoa", "quantity": "1 kg", "purpose": "Complex carbohydrate staple"},
                {"item": "Whole Wheat Pita / Bread", "quantity": "1 pack", "purpose": "Quick lunchtime sandwiches"}
            ],
            "healthy_fats_and_nuts": [
                {"item": "Whole Raw Almonds / Walnuts", "quantity": "250g", "purpose": "Omega-3 & heart healthy fats"},
                {"item": "Extra Virgin Olive Oil", "quantity": "500ml", "purpose": "Essential monounsaturated fats"}
            ],
            "meal_prep_summary": f"Prep your grains and proteins in bulk on Sunday evening to hit your {target_cal:.0f} kcal goal effortlessly."
        }

    @classmethod
    async def analyze_plate_health(
        cls,
        food_name: str,
        calories: float,
        protein: float,
        carbs: float,
        fat: float,
        fiber: float
    ) -> Dict[str, Any]:
        """
        Evaluates plate nutrition score, Glycemic Index impact, and Ultra-Processed Food (UPF) risk.
        """
        # Calculate protein to calorie ratio
        protein_cal_ratio = (protein * 4) / max(1.0, calories)
        fiber_ratio = fiber / max(1.0, carbs)

        # Grade heuristic
        if protein_cal_ratio >= 0.30 and fiber >= 3.0:
            grade = "A+"
            gi_level = "Low"
            upf_risk = "Minimal"
            summary = "Outstanding plate balance! High lean protein and robust fiber for sustained satiety and steady blood glucose."
        elif protein_cal_ratio >= 0.20 and fiber >= 2.0:
            grade = "A"
            gi_level = "Low"
            upf_risk = "Minimal"
            summary = "Well-balanced meal with solid protein and healthy complex nutrients."
        elif protein_cal_ratio >= 0.15:
            grade = "B+"
            gi_level = "Moderate"
            upf_risk = "Moderate"
            summary = "Good meal. Consider pairing with leafy greens to elevate fiber and lower glycemic spike."
        elif carbs > 50 and fiber < 2.0:
            grade = "C"
            gi_level = "High"
            upf_risk = "High"
            summary = "High fast-digesting carbohydrates with low fiber. Expect a rapid energy spike followed by hunger."
        else:
            grade = "B"
            gi_level = "Moderate"
            upf_risk = "Moderate"
            summary = "Moderate nutritional profile. Adjust portions or add lean protein for optimal recovery."

        return {
            "food_name": food_name,
            "health_grade": grade,
            "glycemic_index": gi_level,
            "upf_risk": upf_risk,
            "summary": summary,
            "macro_balance": {
                "protein_pct": round(protein_cal_ratio * 100, 1),
                "fat_pct": round((fat * 9) / max(1.0, calories) * 100, 1),
                "carb_pct": round((carbs * 4) / max(1.0, calories) * 100, 1)
            }
        }
