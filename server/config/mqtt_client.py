import asyncio
import threading
import aiomqtt
import logging
import sys

logger = logging.getLogger(__name__)
MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883
REQUEST_TIMEOUT = 5.0

class ScalesService:
    def __init__(self):
        self._latest_weight: float | None = None
        self._event = asyncio.Event()
        self._lock = threading.Lock()
        self._thread: threading.Thread | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._client: aiomqtt.Client | None = None
        self._ready = threading.Event()

    def start(self):
        """Запускает MQTT-клиент в отдельном потоке с собственным циклом событий."""
        self._thread = threading.Thread(target=self._run_isolated_loop, daemon=True, name="mqtt-worker")
        self._thread.start()
        # Ждём успешного подключения, иначе FastAPI запустится с нерабочим сервисом
        if not self._ready.wait(timeout=10.0):
            raise RuntimeError("Не удалось подключиться к MQTT брокеру за 10 сек.")

    def _run_isolated_loop(self):
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._connection_loop())
        finally:
            self._loop.close()

    async def _connection_loop(self):
        while True:
            try:
                async with aiomqtt.Client(hostname=MQTT_BROKER, port=MQTT_PORT) as client:
                    self._client = client
                    await client.subscribe("weight/out")
                    logger.info("MQTT подключён (изолированный поток)")
                    self._ready.set()  # Сигнализируем главному потоку о готовности
                    async for msg in client.messages:
                        if msg.topic.value == "weight/out":
                            try:
                                val = float(msg.payload.decode().strip())
                                with self._lock:
                                    self._latest_weight = val
                                self._event.set()
                                logger.debug(f"Вес: {val} г")
                            except ValueError:
                                logger.warning("Некорректный формат веса от весов")
            except Exception as e:
                logger.error(f"⚠️ Ошибка соединения: {e}. Переподключение через 5 сек...")
                self._ready.clear()
                await asyncio.sleep(5)
            finally:
                self._client = None

    async def _request_weight_async(self) -> float:
        with self._lock:
            if not self._client:
                raise RuntimeError("MQTT клиент не подключён")
            self._event.clear()
            await self._client.publish("weight/in", "get")
        try:
            await asyncio.wait_for(self._event.wait(), timeout=REQUEST_TIMEOUT)
        except asyncio.TimeoutError:
            raise TimeoutError("Весы не ответили за 5 сек.")
        with self._lock:
            return self._latest_weight

    def get_weight(self) -> float:
        """Синхронный метод для вызова из FastAPI-роутов (выполняется в потоке Uvicorn)."""
        if self._loop is None or self._loop.is_closed():
            raise RuntimeError("MQTT поток не запущен или остановлен")
        # Безопасно перебрасываем корутину в поток с собственным циклом
        future = asyncio.run_coroutine_threadsafe(self._request_weight_async(), self._loop)
        return future.result(timeout=REQUEST_TIMEOUT + 2.0)

    def stop(self):
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5.0)
        logger.info("MQTT поток завершён")