#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// UART setting
#define UART_PORT UART_NUM_0
#define UART_BUF_SIZE 64
#define CMD_BUF_SIZE 32

// HX711 setting
#define SCALE 384.279083
#define HX711_DT_GPIO GPIO_NUM_21
#define HX711_SCK_GPIO GPIO_NUM_22

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
  hx->gain = 128;
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

void app_main() {
  // HX711 init
  hx711_t scales;
  hx711_init(&scales, HX711_DT_GPIO, HX711_SCK_GPIO);
  hx711_tare(&scales, 10);
  hx711_set_scale(&scales, SCALE);

  // Переводим stdin в неблокирующий режим (работает через VFS консоли)
  int flags = fcntl(STDIN_FILENO, F_GETFL);
  fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK);

  printf("Scales ready. Send 'get' to read weight.\n");

  char cmd_buf[32] = {0};
  int buf_len = 0;

  while (1) {
    int c = fgetc(stdin);
    if (c != EOF) {
      if (c == '\n' || c == '\r') {
        cmd_buf[buf_len] = '\0';
        if (strcmp(cmd_buf, "get") == 0) {
          float weight = hx711_get_units(&scales, 10);
          printf("%.2f\n", weight);
          fflush(stdout); // Мгновенная отправка в порт
        }
        buf_len = 0;
        memset(cmd_buf, 0, sizeof(cmd_buf));
      } else if (buf_len < sizeof(cmd_buf) - 1) {
        cmd_buf[buf_len++] = (char)c;
      }
    }
    // Проверка буфера ровно раз в секунду, как ты просил
    vTaskDelay(pdMS_TO_TICKS(20));
  }
}