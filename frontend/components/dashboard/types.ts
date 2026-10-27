export type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    company_id: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
};

export type InterviewSummary = {
  id: string;
  title: string;
  time_limit_min: number;
  expires_at: string;
  created_at: string;
  status_counts: Record<string, number>;
};

export type QuestionItem = {
  text: string;
  rubric: string | null;
};

export type CandidateAttemptItem = {
  id: string;
  email: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  overall_score: number | null;
  recommendation: string | null;
  summary: string | null;
};

export type InterviewDetailResponse = {
  id: string;
  title: string;
  questions: QuestionItem[];
  time_limit_min: number;
  expires_at: string;
  created_at: string;
  attempts: CandidateAttemptItem[];
};

export type InviteResponse = {
  created: string[];
  skipped: string[];
};

export type TranscriptMessage = {
  role: "interviewer" | "candidate";
  text: string;
  timestamp: string;
};

export type PerQuestionScore = {
  question_index: number;
  score: number;
  notes: string;
};

export type AttemptResult = {
  overall_score: number;
  per_question: PerQuestionScore[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  model: string;
  scored_at: string;
};

export type FullAttemptDetail = {
  id: string;
  interview_id: string;
  email: string;
  interview_title: string;
  company_name: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  transcript: TranscriptMessage[];
  result: AttemptResult | null;
  result_error: string | null;
};

export type CompanyAttemptSummary = {
  id: string;
  interview_id: string;
  interview_title: string;
  company_name: string;
  email: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  expires_at: string;
  overall_score: number | null;
  recommendation: string | null;
  summary: string | null;
};

export type TabType =
  | "analytics"
  | "interviews"
  | "create"
  | "invites"
  | "attempts"
  | "company";
