export enum Sender {
  User,
  AI,
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  isFinal?: boolean;
}

export enum CallStatus {
  IDLE,
  CONNECTING,
  CONNECTED,
  ENDED,
}