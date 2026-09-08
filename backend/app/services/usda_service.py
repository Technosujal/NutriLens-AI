import logging
import httpx
from typing import Optional, Dict
from sqlalchemy.orm import Session

from app.config import settings
from app.models.meal import NutritionCache

logger = logging.getLogger("uvicorn.error")

USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

def get_nutrients_from_usda_item(food_item: dict) -> Dict[str, float]:
    """
    Extracts energy (calories), protein, fat, carbs, and fiber per 100g or 100ml
    from a USDA food item JSON structure.
    """
    nutrients = {
        "calories": 0.0,
        "protein": 0.0,
        "fat": 0.0,
        "carbs": 0.0,
        "fiber": 0.0
    }
    
    food_nutrients = food_item.get("foodNutrients", [])
    for nut in food_nutrients:
        # Check by name or nutrientId
        name = nut.get("nutrientName", "").lower()
        value = float(nut.get("value", 0.0))
        nutrient_id = nut.get("nutrientId")
        
        # Energy / Calories
        if nutrient_id == 1008 or "energy" in name:
            # We want kcal, not kJ. Check unitName if available.
            unit = nut.get("unitName", "").lower()
            if "kcal" in unit or not unit:
                nutrients["calories"] = value
            elif "kj" in unit and nutrients["calories"] == 0.0:
                nutrients["calories"] = value * 0.239006  # Convert kJ to kcal
                
        # Protein
        elif nutrient_id == 1003 or "protein" in name:
            nutrients["protein"] = value
            
        # Total Lipid (Fat)
        elif nutrient_id == 1004 or "total lipid" in name or ("fat" in name and "acid" not in name and "saturated" not in name):
            nutrients["fat"] = value
            
        # Carbohydrate
        elif nutrient_id == 1005 or "carbohydrate" in name:
            nutrients["carbs"] = value
            
        # Fiber
        elif nutrient_id == 1079 or "fiber" in name:
            nutrients["fiber"] = value
            
    return nutrients

NON_FOOD_QUERIES = {"hi", "hello", "hey", "test", "testing", "ok", "yes", "no", "food", "eat", "meal", "breakfast", "lunch", "dinner", "snack"}

async def search_usda_food(query: str) -> Optional[Dict[str, float]]:
    """
    Searches the USDA FoodData Central API for a food item query and returns
    nutritional info per 100g/ml if found.
    """
    if not settings.USDA_API_KEY:
        logger.warning("USDA_API_KEY is not set. Skipping USDA API lookup.")
        return None

    clean_query = query.strip().lower().rstrip(".!?,")
    if len(clean_query) < 3 or clean_query in NON_FOOD_QUERIES:
        return None
        
    url = f"{USDA_BASE_URL}/foods/search"
    params = {
        "api_key": settings.USDA_API_KEY,
        "query": clean_query,
        "pageSize": 1
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                logger.error(f"USDA API error: {response.status_code} - {response.text}")
                return None
                
            data = response.json()
            foods = data.get("foods", [])
            if not foods:
                logger.info(f"No food items found in USDA search for: '{query}'")
                return None
                
            best_match = foods[0]
            nutrients = get_nutrients_from_usda_item(best_match)
            
            # Extract standard serving size if available
            serving_size = float(best_match.get("servingSize", 100.0))
            serving_unit = best_match.get("servingSizeUnit", "g")
            
            return {
                "calories": nutrients["calories"],
                "protein": nutrients["protein"],
                "fat": nutrients["fat"],
                "carbs": nutrients["carbs"],
                "fiber": nutrients["fiber"],
                "serving_size": serving_size,
                "serving_unit": serving_unit
            }
    except Exception as e:
        logger.error(f"Failed to query USDA FoodData Central API: {e}")
        return None

async def get_or_create_nutrition(food_name: str, db: Session) -> Optional[NutritionCache]:
    """
    Returns a cached nutrition item or queries the USDA API (and caches it if found).
    """
    normalized_name = food_name.strip().lower()
    
    # 1. Check local cache
    cached_nutrition = db.query(NutritionCache).filter(NutritionCache.food_name == normalized_name).first()
    if cached_nutrition:
        return cached_nutrition
        
    # 2. Try USDA Search
    usda_data = await search_usda_food(normalized_name)
    if usda_data:
        try:
            cache_item = NutritionCache(
                food_name=normalized_name,
                calories=usda_data["calories"],
                protein=usda_data["protein"],
                carbs=usda_data["carbs"],
                fat=usda_data["fat"],
                fiber=usda_data["fiber"],
                serving_size=usda_data["serving_size"],
                serving_unit=usda_data["serving_unit"]
            )
            db.add(cache_item)
            db.commit()
            db.refresh(cache_item)
            return cache_item
        except Exception as e:
            db.rollback()
            logger.error(f"Error caching USDA results for '{food_name}': {e}")
            
    return None
