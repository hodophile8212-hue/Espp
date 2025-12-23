
import React, { useState } from 'react';

const CodeSnippet: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const arduinoCode = `#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// Replace with your network credentials
const char* ssid = "YOUR_ROUTER_SSID";
const char* password = "YOUR_ROUTER_PASSWORD";

ESP8266WebServer server(80);

const int ledPin = LED_BUILTIN; // GPIO 2 on most ESP8266

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "ESP8266 LED Server is running!");
}

void handleLedOn() {
  digitalWrite(ledPin, LOW); // Built-in LED is Active Low
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED IS ON");
}

void handleLedOff() {
  digitalWrite(ledPin, HIGH); // Built-in LED is Active Low
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED IS OFF");
}

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH); // Start with LED off

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/on", handleLedOn);
  server.on("/off", handleLedOff);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800">
        <span className="text-xs font-mono text-slate-400">ESP8266_Controller.ino</span>
        <button 
          onClick={handleCopy}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          {copied ? <><i className="fas fa-check"></i> Copied</> : <><i className="fas fa-copy"></i> Copy Code</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-emerald-400">
        <code>{arduinoCode}</code>
      </pre>
    </div>
  );
};

export default CodeSnippet;
