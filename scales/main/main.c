#include "driver/gpio.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "mqtt_client.h"
#include "nvs_flash.h"
#include <stdio.h>
#include <string.h>

#define BTN_GPIO GPIO_NUM_0
#define LED_GPIO GPIO_NUM_2
#define LED_HIGH 1

static const char *TAG = "wifi_ctrl";
static const char *MQTT_TAG = "MQTT_ctrl";
static bool g_connect_requested = false;
static volatile bool g_wifi_connected = false;
// ==========================================================
#define SCALE 384.279083
#define HX711_DT_GPIO GPIO_NUM_16
#define HX711_SCK_GPIO GPIO_NUM_4

typedef struct {
  int dt_pin;
  int sck_pin;
  int gain;
  int offset;
  float scale;
} hx711_t;

static const char *HX711_TAG = "HX711";

void hx711_init(hx711_t *hx, int dt_pin, int sck_pin) {
  hx->dt_pin = dt_pin;
  hx->sck_pin = sck_pin;
  hx->gain = 27;
  hx->offset = 0;
  hx->scale = 1.0;

  // Настройка пинов
  gpio_set_direction(dt_pin, GPIO_MODE_INPUT);
  gpio_set_direction(sck_pin, GPIO_MODE_OUTPUT);

  // Начальное состояние
  gpio_set_level(sck_pin, 0);
}

int32_t hx711_read(hx711_t *hx) {
  // Ждем пока данные готовы (DT становится LOW)
  while (gpio_get_level(hx->dt_pin) == 1) {
    vTaskDelay(1 / portTICK_PERIOD_MS);
  }

  int32_t data = 0;

  // Читаем 24 бита данных
  for (int i = 0; i < 24; i++) {
    gpio_set_level(hx->sck_pin, 1);
    esp_rom_delay_us(1);

    data <<= 1;
    if (gpio_get_level(hx->dt_pin)) {
      data++;
    }

    gpio_set_level(hx->sck_pin, 0);
    esp_rom_delay_us(1);
  }

  // Устанавливаем усиление для следующего чтения
  for (int i = 0; i < hx->gain; i++) {
    gpio_set_level(hx->sck_pin, 1);
    esp_rom_delay_us(1);
    gpio_set_level(hx->sck_pin, 0);
    esp_rom_delay_us(1);
  }

  // Преобразование в знаковое 32-битное число
  if (data & 0x800000) {
    data |= 0xFF000000;
  }

  return data;
}

int32_t hx711_read_average(hx711_t *hx, int times) {
  int64_t sum = 0;
  for (int i = 0; i < times; i++) {
    sum += hx711_read(hx);
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
  return sum / times;
}

void hx711_tare(hx711_t *hx, int times) {
  int32_t avg = hx711_read_average(hx, times);
  hx->offset = avg;
  ESP_LOGI(HX711_TAG, "Tare complete. Offset: %ld", hx->offset);
}

void hx711_set_scale(hx711_t *hx, float scale) { hx->scale = scale; }

float hx711_get_units(hx711_t *hx, int times) {
  int32_t value = hx711_read_average(hx, times) - hx->offset;
  return (float)value / hx->scale;
}
// ==========================================================
#define MQTT_BROKER_URL "mqtt://192.168.3.2:1883"
#define MQTT_PUBLISH_TOPIC "data/server"
#define MQTT_PUBLISH_INTERVAL_MS 1000

static esp_mqtt_client_handle_t mqtt_client = NULL;
static hx711_t hx;

static void mqtt_event_handler(void *handler_args, esp_event_base_t base,
                               int32_t event_id, void *event_data) {
  esp_mqtt_event_handle_t event = event_data;
  switch (event_id) {
  case MQTT_EVENT_CONNECTED:
    ESP_LOGI(MQTT_TAG, "MQTT connected");
    esp_mqtt_client_subscribe(event->client, "data/esp", 1);
    break;
  case MQTT_EVENT_DATA:
    if (event->data_len == 3 && strncmp(event->data, "get", 3) == 0) {
      float weight = hx711_get_units(&hx, 5);
      char payload[32];
      snprintf(payload, sizeof(payload), "%.2f", weight);
      esp_mqtt_client_publish(event->client, MQTT_PUBLISH_TOPIC, payload, 0, 1,
                              0);
      ESP_LOGI(MQTT_TAG, "Response: %s", payload);
    }
    ESP_LOGI(MQTT_TAG, "TOPIC=%.*s DATA=%.*s", event->topic_len, event->topic,
             event->data_len, event->data);
    break;
  case MQTT_EVENT_DISCONNECTED:
    ESP_LOGI(MQTT_TAG, "MQTT disconnected");
    break;
  case MQTT_EVENT_ERROR:
    ESP_LOGE(MQTT_TAG, "MQTT error");
    break;
  }
}

void mqtt_app_start(void) {
  esp_mqtt_client_config_t cfg = {
      .broker.address.uri = MQTT_BROKER_URL,
  };
  mqtt_client = esp_mqtt_client_init(&cfg);
  esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID,
                                 mqtt_event_handler, NULL);
}
// ==========================================================

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data) {
  if (event_id == WIFI_EVENT_STA_DISCONNECTED) {
    g_wifi_connected = false;
    ESP_LOGI(TAG, "Disconnected");
    if (mqtt_client) {
      esp_mqtt_client_stop(mqtt_client);
      ESP_LOGI(TAG, "MQTT client stopped");
    }
    if (g_connect_requested) {
      ESP_LOGI(TAG, "Trying to reconnect...");
      esp_wifi_connect();
    }
  } else if (event_id == IP_EVENT_STA_GOT_IP) {
    g_wifi_connected = true;
    ESP_LOGI(TAG, "Connected, IP: " IPSTR,
             IP2STR(&((ip_event_got_ip_t *)event_data)->ip_info.ip));
    if (g_connect_requested && mqtt_client)
      esp_mqtt_client_start(mqtt_client);
  }
}

void wifi_init_sta(void) {
  esp_err_t ret = nvs_flash_init();
  if (ret == ESP_ERR_NVS_NO_FREE_PAGES ||
      ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    ESP_ERROR_CHECK(nvs_flash_erase());
    ret = nvs_flash_init();
  }
  ESP_ERROR_CHECK(ret);

  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());
  esp_netif_create_default_wifi_sta();

  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));

  esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID,
                                      &wifi_event_handler, NULL, NULL);
  esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP,
                                      &wifi_event_handler, NULL, NULL);

  wifi_config_t wifi_config = {
      .sta =
          {
              .ssid = "realme 10",
              .password = "12345678",
              .threshold.authmode = WIFI_AUTH_WPA2_PSK,
          },
  };
  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
  ESP_ERROR_CHECK(esp_wifi_start());
}

void app_main(void) {
  gpio_set_direction(BTN_GPIO, GPIO_MODE_INPUT);
  gpio_pullup_en(BTN_GPIO);
  gpio_set_direction(LED_GPIO, GPIO_MODE_OUTPUT);

  hx711_init(&hx, HX711_DT_GPIO, HX711_SCK_GPIO);
  hx711_tare(&hx, 10);
  hx711_set_scale(&hx, SCALE);

  wifi_init_sta();
  mqtt_app_start();

  bool last_btn = true;
  TickType_t last_toggle = 0;

  while (1) {
    bool btn = gpio_get_level(BTN_GPIO) == 0;

    if (btn && !last_btn &&
        (xTaskGetTickCount() - last_toggle > pdMS_TO_TICKS(200))) {
      g_connect_requested = !g_connect_requested;
      if (g_connect_requested) {
        esp_wifi_connect();
      } else {
        esp_wifi_disconnect();
        if (mqtt_client) {
          esp_mqtt_client_stop(mqtt_client);
          ESP_LOGI(TAG, "MQTT client stopped");
        }
      }
      last_toggle = xTaskGetTickCount();
      ESP_LOGI(TAG, "Button: %s",
               g_connect_requested ? "connect" : "disconnect");
    }
    last_btn = btn;

    gpio_set_level(LED_GPIO, g_wifi_connected);
    vTaskDelay(pdMS_TO_TICKS(20));
  }
}