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

export type TabType =
  | "analytics"
  | "interviews"
  | "create"
  | "invites"
  | "company";
