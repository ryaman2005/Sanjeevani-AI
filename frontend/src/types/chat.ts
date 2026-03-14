export interface DiagnosisResult {
  severity?: "Urgent" | "Medium" | "Low";
  top_conditions: { disease: string; probability: number }[];
  explanation: string;
  precautions: string[];
  what_to_do: string[];
  emergency_signs: string[];
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  instructions: string;
}

export interface PrescriptionResult {
  doctor: string;
  clinic: string;
  medicines: PrescriptionMedicine[];
  precautions: string[];
  summary: string;
}

export interface TriageResult {
  questions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  diagnosis?: DiagnosisResult;
  prescription?: PrescriptionResult;
  triage?: TriageResult;
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
