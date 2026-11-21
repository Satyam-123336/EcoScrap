/*
 * ============================================================
 *  EcoScrap Pickup Drone — ESP32 AIR UNIT FIRMWARE (TRANSPARENT BRIDGE)
 *  Mounts on the drone, wired to Flight Controller TELEM1 port
 * ============================================================
 *
 *  WIRING (Air Unit ESP32 → Flight Controller TELEM1):
 *  ┌─────────────────────┬───────────────────────┐
 *  │  ESP32 Pin          │  CrossFlight TELEM1   │
 *  ├─────────────────────┼───────────────────────┤
 *  │  GPIO16 (RX2)       │  Pin 2: TX            │
 *  │  GPIO17 (TX2)       │  Pin 3: RX            │
 *  │  GND                │  Pin 4: GND           │
 *  │  VIN                │  Pin 1: VCC (5V)      │
 *  └─────────────────────┴───────────────────────┘
 *
 *  Pure, zero-overhead serial bridge:
 *  - FC UART2 (57600) <---> ESP-NOW (Channel 1) <---> Ground Unit
 *  - 100% transparent: raw MAVLink frames pass without alteration
 * ============================================================
 */

#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_idf_version.h>

// ── Configuration ─────────────────────────────────────────────────────────────

// Ground unit MAC (detected on COM9)
uint8_t GROUND_UNIT_MAC[6] = {0x68, 0x09, 0x47, 0x74, 0xC1, 0xA0};

#define FC_SERIAL       Serial2       // UART2 — GPIO16 RX, GPIO17 TX
#define FC_BAUD_RATE    115200        // Standard high-speed telemetry baud
#define LED_PIN         2             // Built-in blue LED for activity indication
#define BUFFER_SIZE     240           // ESP-NOW max payload per packet

static bool peerRegistered = false;
static uint8_t fcRxBuf[BUFFER_SIZE];

// ── ESP-NOW Callbacks ─────────────────────────────────────────────────────────

#if defined(ESP_IDF_VERSION) && ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {}
void onDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len > 0) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Toggle LED on command from ground
    FC_SERIAL.write(data, len);                   // Forward directly to Flight Controller
  }
}
#else
void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {}
void onDataRecv(const uint8_t *mac_addr, const uint8_t *data, int len) {
  if (len > 0) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Toggle LED on command from ground
    FC_SERIAL.write(data, len);                   // Forward directly to Flight Controller
  }
}
#endif

// ── Setup ──────────────────────────────────────────────────────────────────────

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Set Wi-Fi Station mode and lock strictly to Channel 1
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE);

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    while (true) delay(1000);
  }

  esp_now_register_send_cb(onDataSent);
  esp_now_register_recv_cb(onDataRecv);

  // Register ground unit as peer strictly on Channel 1
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, GROUND_UNIT_MAC, 6);
  peerInfo.channel = 1;
  peerInfo.ifidx = WIFI_IF_STA;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) == ESP_OK) {
    peerRegistered = true;
    // Double-blink confirming peer registered
    digitalWrite(LED_PIN, HIGH); delay(80);
    digitalWrite(LED_PIN, LOW);  delay(80);
    digitalWrite(LED_PIN, HIGH); delay(80);
    digitalWrite(LED_PIN, LOW);
  }

  // Start FC UART (Serial2: GPIO16=RX, GPIO17=TX)
  FC_SERIAL.begin(FC_BAUD_RATE, SERIAL_8N1, 16, 17);
}

// ── Main Loop ─────────────────────────────────────────────────────────────────

void loop() {
  // Flight Controller UART → Ground Unit: Read telemetry from FC and forward over ESP-NOW
  int avail = FC_SERIAL.available();
  if (avail > 0 && peerRegistered) {
    int toRead = min(avail, BUFFER_SIZE);
    int n = FC_SERIAL.readBytes(fcRxBuf, toRead);
    if (n > 0) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Toggle LED on FC traffic
      esp_now_send(GROUND_UNIT_MAC, fcRxBuf, n);
    }
  }

  delay(1);
}
