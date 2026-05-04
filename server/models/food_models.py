from typing import Optional
from sqlmodel import Field, SQLModel

# Таблица в БД
class Food(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, description="Название продукта")
    weight_g: Optional[float] = Field(default=None, description="Вес в граммах")
    calories_per_100g: Optional[float] = Field(default=None, description="Калорий на 100г")
    protein_per_100g: Optional[float] = Field(default=None, description="Белки на 100г")
    fat_per_100g: Optional[float] = Field(default=None, description="Жиры на 100г")
    carbs_per_100g: Optional[float] = Field(default=None, description="Углеводы на 100г")
    category: Optional[str] = Field(default=None, description="Категория (фрукт, овощ, мясо...)")
    is_in_fridge: Optional[bool] = Field(index=True, default=False, description="Находится ли в холодильнике")

# Схема для создания
class FoodCreate(SQLModel):
    name: str
    weight_g: Optional[float] = None
    calories_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    category: Optional[str] = None
    is_in_fridge: Optional[bool] = None

# Схема для обновления (все поля опциональны)
class FoodUpdate(SQLModel):
    name: Optional[str] = None
    weight_g: Optional[float] = None
    calories_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    category: Optional[str] = None
    is_in_fridge: Optional[bool] = None

# Схема для ответа (включает id)
class FoodRead(SQLModel):
    id: int
    name: str
    weight_g: Optional[float]
    calories_per_100g: Optional[float]
    protein_per_100g: Optional[float]
    fat_per_100g: Optional[float]
    carbs_per_100g: Optional[float]
    category: Optional[str]
    is_in_fridge: Optional[bool]