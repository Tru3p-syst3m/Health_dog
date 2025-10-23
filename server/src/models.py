from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float
Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)           # Название продукта
    # category = Column(String)                       # Категория (фрукты, овощи, мясо и т.д.)
    # unit = Column(String, nullable=False)           # Единица измерения: 'g' (граммы) или 'ml' (миллилитры)
    weight_grams = Column(Float)                    # Вес в граммах (для твердых продуктов)
    # volume_ml = Column(Float)                       # Объем в мл (для жидкостей)
    # protein = Column(Float, nullable=False)         # Белки на 100г/100мл
    # fat = Column(Float, nullable=False)             # Жиры на 100г/100мл  
    # carbs = Column(Float, nullable=False)           # Углеводы на 100г/100мл
    # calories = Column(Float)                        # Калории на 100г/100мл
    
    def __repr__(self):
        return f"<Product(name='{self.name}', val='{self.weight_grams}')>"