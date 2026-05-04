from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from config.database import food_db_get_session
from models.food_models import Food, FoodCreate, FoodRead, FoodUpdate

router = APIRouter(prefix="/foods", tags=["foods"])


@router.post("/", response_model=FoodRead, status_code=201)
def create_food(food: FoodCreate, session: Session = Depends(food_db_get_session)):
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
    session: Session = Depends(food_db_get_session),
):
    query = select(Food)
    if category:
        query = query.where(Food.category == category)
    foods = session.exec(query.offset(offset).limit(limit)).all()
    return foods

@router.get("/fridge", response_model=List[FoodRead])
def get_fridge_items(session: Session = Depends(food_db_get_session)):
    food = session.exec(select(Food).where(Food.is_in_fridge == True)).all()
    return food

@router.get("/{food_id}", response_model=FoodRead)
def get_food(food_id: int, session: Session = Depends(food_db_get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    return food


@router.patch("/{food_id}", response_model=FoodRead)
def update_food(food_id: int, food_update: FoodUpdate, session: Session = Depends(food_db_get_session)):
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
def add_to_fridge(food_id: int, food_update: FoodUpdate, session: Session = Depends(food_db_get_session)):
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
def delete_food(food_id: int, session: Session = Depends(food_db_get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    session.delete(food)
    session.commit()

@router.delete("/fridge/{food_id}", status_code=204)
def delete_from_fridge(food_id: int, session: Session = Depends(food_db_get_session)):
    food = session.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    food.is_in_fridge = False
    food.weight_g = None
    session.add(food)
    session.commit()