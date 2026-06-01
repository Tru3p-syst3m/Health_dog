from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel

from config.database import get_session
from models.food_models import Food, FoodCreate, FoodRead, FoodUpdate

router = APIRouter(prefix="/foods", tags=["foods"])

class IngredientInput(SQLModel):
    food_id: int
    weight_g: float

class CompositeFoodCreate(SQLModel):
    name: str
    ingredients: List[IngredientInput]

@router.post("/", response_model=FoodRead, status_code=201)
def create_food(food: FoodCreate, session: Session = Depends(get_session)):
    db_food = Food.model_validate(food)
    session.add(db_food)
    session.commit()
    session.refresh(db_food)
    return db_food


@router.get("/", response_model=List[FoodRead])
def list_foods(
    category: Optional[str] = Query(default=None, description="Фильтр по категории"),
    offset: int = 0,
    limit: int = Query(default=20, le=100),
    session: Session = Depends(get_session),
):
    query = select(Food)
    if category:
        query = query.where(Food.category == category)
    foods = session.exec(query.offset(offset).limit(limit)).all()
    return foods

@router.get("/fridge", response_model=List[FoodRead])
def get_fridge_items(session: Session = Depends(get_session)):
    food = session.exec(select(Food).where(Food.is_in_fridge == True)).all()
    return food

@router.get("/{food_id}", response_model=FoodRead)
def get_food(food_id: int, session: Session = Depends(get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return food


@router.patch("/{food_id}", response_model=FoodRead)
def update_food(food_id: int, food_update: FoodUpdate, session: Session = Depends(get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    update_data = food_update.model_dump(exclude_unset=True)
    food.sqlmodel_update(update_data)
    session.add(food)
    session.commit()
    session.refresh(food)
    return food

@router.patch("/fridge/{food_id}", response_model=FoodRead)
def add_to_fridge(food_id: int, food_update: FoodUpdate, session: Session = Depends(get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")

    food.is_in_fridge = True

    incoming_w = food_update.weight_g
    if incoming_w is not None:
        food.weight_g = (food.weight_g or 0) + incoming_w

    session.add(food)
    session.commit()
    session.refresh(food)
    return food


@router.delete("/{food_id}", status_code=204)
def delete_food(food_id: int, session: Session = Depends(get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    session.delete(food)
    session.commit()

@router.delete("/fridge/{food_id}", status_code=204)
def delete_from_fridge(food_id: int, session: Session = Depends(get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    food.is_in_fridge = False
    food.weight_g = None
    session.add(food)
    session.commit()

@router.post("/composite", response_model=FoodRead, status_code=201)
def create_composite_food(payload: CompositeFoodCreate, session: Session = Depends(get_session)):
    if not payload.ingredients:
        raise HTTPException(400, "Добавьте хотя бы один ингредиент")

    total_weight = 0.0
    total_cal = total_p = total_f = total_c = 0.0

    for ing in payload.ingredients:
        food = session.get(Food, ing.food_id)
        if not food:
            raise HTTPException(404, f"Продукт id={ing.food_id} не найден")
        if ing.weight_g <= 0:
            raise HTTPException(400, f"Вес для '{food.name}' должен быть больше 0")

        w = ing.weight_g
        total_weight += w
        factor = w / 100.0
        total_cal += (food.calories_per_100g or 0) * factor
        total_p   += (food.protein_per_100g or 0) * factor
        total_f   += (food.fat_per_100g or 0) * factor
        total_c   += (food.carbs_per_100g or 0) * factor

    if total_weight == 0:
        raise HTTPException(400, "Общий вес блюда не может быть нулевым")

    # Создаём обычный продукт с рассчитанными средними значениями
    new_food = Food(
        name=payload.name,
        calories_per_100g=round(total_cal / total_weight * 100, 2),
        protein_per_100g=round(total_p / total_weight * 100, 2),
        fat_per_100g=round(total_f / total_weight * 100, 2),
        carbs_per_100g=round(total_c / total_weight * 100, 2),
        category="блюдо",
        is_in_fridge=False, # По умолчанию не в холодильнике
        weight_g=None
    )
    session.add(new_food)
    session.commit()
    session.refresh(new_food)
    return new_food