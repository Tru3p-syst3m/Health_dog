from fastapi import APIRouter, Request, HTTPException, Depends
from config.mqtt_client import ScalesService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scales", tags=["scales"])

async def get_scales_service(request: Request) -> ScalesService:
    return request.app.state.scales_service

@router.get("/weight")
async def get_current_weight(service: ScalesService = Depends(get_scales_service)):
    try:
        weight_g = service.get_weight()
        return {"weight_g": round(weight_g, 2), "status": "ok"}
    except TimeoutError:
        logger.warning("Таймаут при опросе весов")
        raise HTTPException(status_code=504, detail="Весы не ответили. Проверьте подключение.")
    except Exception as e:
        logger.error(f"Ошибка связи с весами: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")