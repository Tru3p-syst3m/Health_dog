import threading
import time
import logging
from typing import Optional
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion

logger = logging.getLogger(__name__)

MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883
REQUEST_TIMEOUT = 5.0

class ScalesService:
    def __init__(self, broker: str = MQTT_BROKER, port: int = MQTT_PORT, timeout: float = REQUEST_TIMEOUT):
        self._broker = broker
        self._port = port
        self._timeout = timeout
        
        # Потокобезопасные примитивы
        self._lock = threading.Lock()
        self._response_event = threading.Event()
        self._latest_weight: Optional[float] = None
        
        self._connected = False
        self._running = False

        # Инициализация клиента v2 (совместим с Python 3.7+)
        self._client = mqtt.Client(callback_api_version=CallbackAPIVersion.VERSION2)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info("✅ MQTT подключен к брокеру")
            # Подписываемся на топик, куда ESP публикует вес
            client.subscribe("data/server", qos=1)
            self._connected = True
        else:
            logger.error(f"❌ Ошибка подключения MQTT, код: {reason_code}")

    def _on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode().strip()
            weight = float(payload)
            with self._lock:
                self._latest_weight = weight
                self._response_event.set()
        except ValueError:
            logger.warning(f"Некорректные данные от весов: {msg.payload}")
        except Exception as e:
            logger.error(f"Ошибка обработки MQTT сообщения: {e}")

    def _on_disconnect(self, client, userdata, flags, reason_code):
        self._connected = False
        logger.info(f"MQTT отключен. Код: {reason_code}")

    def start(self):
        """Запускает фоновый MQTT клиент. Не блокирует FastAPI."""
        if self._running:
            logger.warning("ScalesService уже запущен")
            return
        
        self._running = True
        try:
            self._client.connect(self._broker, self._port, keepalive=60)
            # loop_start() запускает сетевой цикл в отдельном потоке
            self._client.loop_start()

            # Ждём успешного подключения (макс 5 сек)
            for _ in range(50):
                if self._connected:
                    break
                time.sleep(0.1)
            
            if not self._connected:
                raise RuntimeError("Не удалось подключиться к MQTT брокеру за 5 сек.")
                
        except Exception as e:
            self._running = False
            self._client.loop_stop()
            raise RuntimeError(f"Ошибка запуска MQTT клиента: {e}") from e

    def get_weight(self) -> float:
        """Синхронный запрос веса. Безопасен для вызова из FastAPI роутов."""
        if not self._connected:
            raise ConnectionError("MQTT клиент не подключен к брокеру")

        self._response_event.clear()
        with self._lock:
            self._latest_weight = None
            # Отправляем команду "get" в топик, на который подписана ESP
            self._client.publish("data/esp", "get", qos=1)
            

        # Ждём ответа от потока-обработчика сообщений
        if self._response_event.wait(timeout=self._timeout):
            if self._latest_weight is not None:
                return self._latest_weight
                    
        raise TimeoutError("Весы не ответили. Проверьте Wi-Fi, брокер и прошивку.")

    def stop(self):
        """Корректно останавливает клиент и фоновый поток."""
        self._running = False
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
        logger.info("ScalesService остановлен")