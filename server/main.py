from contextlib import asynccontextmanager
from fastapi import FastAPI
from config.settings import settings
from config.database import db_create
from config.mqtt_client import ScalesService
from routes.food_routes import router as food_router
from routes.meal_routes import router as meal_router
from routes.scales_routes import router as scales_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.scales_service = ScalesService()
    app.state.scales_service.start()
    db_create()
    yield
    app.state.scales_service.stop()


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.include_router(food_router)
app.include_router(meal_router)
app.include_router(scales_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "env": settings.ENVIRONMENT,
        "app-name": settings.APP_NAME,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)