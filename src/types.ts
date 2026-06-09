export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: string;
  journal: string;
  oneLiner: string;
  problemStatement: string;
  coreContribution: string;
  methodology: string;
  keyResults: string[];
  limitations: string[];
  futureWork: string[];
  tags: string[];
  confidenceScore: number;
  readStatus: "Read Deeply" | "Skim" | "Archived" | "Discarded";
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  pdfBase64?: string; // Cache the PDF raw base64 if wanted for session chats
}

export type TabName = "core" | "methodology" | "analysis";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}
