import asyncio
from app.database import SessionLocal
from app.models import User, Meal
from app.services.rag_features_service import RAGFeaturesService

async def main():
    db = SessionLocal()
    user = db.query(User).first()
    hist = [
        {'role': 'user', 'content': 'What should I eat?'},
        {'role': 'model', 'content': 'You can have 2 scrambled eggs, 500ml coconut water, and 1 apple for breakfast.'}
    ]
    res = await RAGFeaturesService.chat_with_coach(
        query='add this in meal',
        user=user,
        db=db,
        chat_history=hist,
        target_date='2026-08-31'
    )
    print('RESPONSE ACTION:', res.get('action_performed'))
    latest = db.query(Meal).filter(Meal.user_id == user.id, Meal.date == '2026-08-31').order_by(Meal.id.desc()).first()
    if latest:
        print(f'LATEST SAVED MEAL: ID={latest.id}, Name={latest.name}, Calories={latest.total_calories} kcal, Items={len(latest.items)}')
        for item in latest.items:
            print(f'  - {item.food_name}: {item.calories} kcal ({item.protein}g P, {item.carbs}g C, {item.fat}g F)')
    else:
        print('No meal saved.')

if __name__ == '__main__':
    asyncio.run(main())
