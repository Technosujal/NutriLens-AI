from datetime import datetime

def get_meal_type_by_time() -> str:
    """
    Determines the meal type based on the current time of day.
    """
    current_hour = datetime.now().hour
    if 5 <= current_hour < 12:
        return "Breakfast"
    elif 12 <= current_hour < 17:
        return "Lunch"
    elif 17 <= current_hour < 21:
        return "Dinner"
    else:
        return "Snack"
