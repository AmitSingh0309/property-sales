
export enum Sender {
  User,
  AI,
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  image?: string; // base64 URL for display
}

export interface ContentPart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export interface Content {
    role: 'user' | 'model';
    parts: ContentPart[];
}
