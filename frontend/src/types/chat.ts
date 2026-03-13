export interface DiagnosisResult {
  severity: "Urgent" | "Medium" | "Low" | "Unknown" | "URGENT";
  diseases: { name: string; confidence: number }[];
  advice: string;
  narrative?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  diagnosis?: DiagnosisResult;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface PatientDemographics {
  name: string;
  age: string;
  gender: string;
}
