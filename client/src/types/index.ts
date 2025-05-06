export interface Message {
  id: number;
  userId: string;
  content: string;
  isFromUser: number; // 1 for user, 0 for Rex
  timestamp: Date;
}

export interface Memory {
  id: number;
  userId: string;
  context: any; // Complex context object
  lastUpdated: Date;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
}

export interface Content {
  id: number;
  type: string; // 'microblog', 'reflection', etc.
  content: string;
  timestamp: Date;
}

export interface TerminalTheme {
  bg: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export interface AdminState {
  isAdmin: boolean;
  isAuthenticated: boolean;
  memories: Memory[];
  settings: Setting[];
  contents: Content[];
}
