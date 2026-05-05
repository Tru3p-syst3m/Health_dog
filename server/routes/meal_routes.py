from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from config.database import get_session
from models.food_models import Food
from models.meal_log_models import MealLog, MealLogItem

router = APIRouter(prefix="/meals", tags=["meals"])

class MealItemInput(SQLModel):
    fridge_id: int
    consumed_g: float

class MealCreateInput(SQLModel):
    items: List[MealItemInput]

@router.post("/", response_model=MealLog, status_code=201)
def create_meal(payload: MealCreateInput, session: Session = Depends(get_session)):
    if not payload.items:
        raise HTTPException(400, "Список продуктов пуст")

    food_records = []
    total_kcal = total_p = total_f = total_c = 0.0
    meal_items_to_create = []

    # 1. Валидация и расчёт нутриентов
    for item in payload.items:
        food = session.get(Food, item.fridge_id)
        if not food:
            raise HTTPException(404, f"Продукт id={item.fridge_id} не найден")
        if not food.is_in_fridge:
            raise HTTPException(400, f"'{food.name}' отсутствует в холодильнике")
        if food.weight_g is None or item.consumed_g > food.weight_g:
            raise HTTPException(400, f"Недостаточно '{food.name}'. Доступно: {food.weight_g}г")

        factor = item.consumed_g / 100.0
        kcal = (food.calories_per_100g or 0) * factor
        p = (food.protein_per_100g or 0) * factor
        f = (food.fat_per_100g or 0) * factor
        c = (food.carbs_per_100g or 0) * factor

        total_kcal += kcal; total_p += p; total_f += f; total_c += c

        meal_items_to_create.append(MealLogItem(
            food_id=food.id,
            weight_consumed_g=item.consumed_g,
            calories=round(kcal, 2),
            protein=round(p, 2),
            fat=round(f, 2),
            carbs=round(c, 2)
        ))

        # 2. Списываем вес с холодильника
        food.weight_g -= item.consumed_g
        if food.weight_g <= 0:
            food.weight_g = 0
            food.is_in_fridge = False  # Автоматически убираем из холодильника

    # 3. Создаём запись приёма пищи
    meal_log = MealLog(
        total_calories=round(total_kcal, 2),
        total_protein=round(total_p, 2),
        total_fat=round(total_f, 2),
        total_carbs=round(total_c, 2),
        items=meal_items_to_create
    )
    session.add(meal_log)
    session.add_all(meal_items_to_create)
    session.commit()
    session.refresh(meal_log)
    return meal_log