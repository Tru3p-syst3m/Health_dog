from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship

class MealLogItem(SQLModel, table=True):
    __tablename__ = "meallogitem"
    id: Optional[int] = Field(default=None, primary_key=True)
    meal_log_id: int = Field(foreign_key="meallog.id")
    food_id: Optional[int] = Field(default=None, foreign_key="food.id", nullable=True)
    food_name: str = Field(default="")
    weight_consumed_g: float
    # Фиксируем расчет на момент приема. Если обновишь данные в Food, история не сломается.
    calories: float = Field(default=0.0)
    protein: float = Field(default=0.0)
    fat: float = Field(default=0.0)
    carbs: float = Field(default=0.0)

    meal_log: Optional["MealLog"] = Relationship(back_populates="items")

class MealLog(SQLModel, table=True):
    __tablename__ = "meallog"
    id: Optional[int] = Field(default=None, primary_key=True)
    eaten_at: datetime = Field(default_factory=datetime.now, index=True)
    total_calories: float = Field(default=0.0)
    total_protein: float = Field(default=0.0)
    total_fat: float = Field(default=0.0)
    total_carbs: float = Field(default=0.0)

    items: list[MealLogItem] = Relationship(back_populates="meal_log")
    
class MealLogItemRead(SQLModel):
    id: int
    food_name: str
    weight_consumed_g: float
    calories: float
    protein: float
    fat: float
    carbs: float

class MealLogRead(SQLModel):
    id: int
    eaten_at: datetime
    total_calories: float
    total_protein: float
    total_fat: float
    total_carbs: float
    items: list[MealLogItemRead] = []