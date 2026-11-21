/*
 * ============================================================
 *  EcoScrap Pickup Drone — ESP32 GROUND UNIT FIRMWARE (TRANSPARENT BRIDGE)
 *  Stays at base station, plugged into PC via USB-C (CP2102)
 * ============================================================
 *
 *  Pure, zero-overhead serial bridge:
 *  - PC USB Serial (57600) <---> ESP-NOW (Channel 1) <---> Air Unit
 *  - 100% transparent: raw MAVLink frames pass without alteration
 * ============================================================
 */

#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_idf_version.h>

// ── Configuration ─────────────────────────────────────────────────────────────

// Air unit MAC (detected on COM9)
uint8_t AIR_UNIT_MAC[6] = {0x68, 0x09, 0x47, 0x44, 0x4A, 0x8C};

#define PC_SERIAL       Serial          // USB Serial → PC
#define PC_BAUD_RATE    115200          // Must match pymavlink connection baud
#define LED_PIN         2               // Built-in blue LED for activity indication
#define BUFFER_SIZE     240             // ESP-NOW max payload per packet

static bool peerRegistered = false;
static uint8_t pcRxBuf[BUFFER_SIZE];

// ── ESP-NOW Callbacks ─────────────────────────────────────────────────────────

#if defined(ESP_IDF_VERSION) && ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {}
void onDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len > 0) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Toggle LED on incoming packet
    PC_SERIAL.write(data, len);                    // Forward directly to PC
  }
}
#else
void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {}
void onDataRecv(const uint8_t *mac_addr, const uint8_t *data, int len) {
  if (len > 0) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Toggle LED on incoming packet
    PC_SERIAL.write(data, len);                    // Forward directly to PC
  }
}
#endif

// ── Setup ──────────────────────────────────────────────────────────────────────

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  PC_SERIAL.begin(PC_BAUD_RATE);

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

  // Register air unit as peer strictly on Channel 1
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, AIR_UNIT_MAC, 6);
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
}

// ── Main Loop ─────────────────────────────────────────────────────────────────

void loop() {
  // PC USB → Air Unit: Read commands from PC and forward directly over ESP-NOW
  int avail = PC_SERIAL.available();
  if (avail > 0 && peerRegistered) {
    int toRead = min(avail, BUFFER_SIZE);
    int n = PC_SERIAL.readBytes(pcRxBuf, toRead);
    if (n > 0) {
      esp_now_send(AIR_UNIT_MAC, pcRxBuf, n);
    }
  }

  delay(1);
}
