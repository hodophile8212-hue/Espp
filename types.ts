
export interface ESPConfig {
  ipAddress: string;
  port: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export enum LEDStatus {
  ON = 'ON',
  OFF = 'OFF',
  UNKNOWN = 'UNKNOWN'
}
