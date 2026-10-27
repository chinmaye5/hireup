"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";

import Sidebar from "@/components/dashboard/Sidebar";
import AnalyticsView from "@/components/dashboard/AnalyticsView";
import InterviewsView from "@/components/dashboard/InterviewsView";
import CreateInterviewView from "@/components/dashboard/CreateInterviewView";
import CandidateInvitesView from "@/components/dashboard/CandidateInvitesView";
import CompanyProfileView from "@/components/dashboard/CompanyProfileView";
import CreateCompanyView from "@/components/dashboard/CreateCompanyView";
import CandidatesAttemptsView from "@/components/dashboard/CandidatesAttemptsView";

import {
  MeResponse,
  InterviewSummary,
  InterviewDetailResponse,
  InviteResponse,
  TabType,
} from "@/components/dashboard/types";

export default function DashboardPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>("analytics");

  // Core data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [company, setCompany] = useState<MeResponse["company"]>(null);
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);

  // Create Company form state
  const [companyName, setCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Create Interview form state
  const [interviewTitle, setInterviewTitle] = useState("");
  const [questionsRaw, setQuestionsRaw] = useState(
    "Brief background and primary tech stack. || Breadth and clarity\nExplain synchronous vs asynchronous execution. || Event loop and non-blocking I/O\nDescribe a challenging debugging experience. || Systematic problem solving"
  );
  const [timeLimitMin, setTimeLimitMin] = useState(15);
  const [expiresAt, setExpiresAt] = useState("2026-12-31T23:59");
  const [creatingInterview, setCreatingInterview] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search query for Interviews view
  const [searchQuery, setSearchQuery] = useState("");

  // Invites view state
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");
  const [selectedInterviewDetail, setSelectedInterviewDetail] =
    useState<InterviewDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [inviteEmailsText, setInviteEmailsText] = useState("");
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [copiedAttemptId, setCopiedAttemptId] = useState<string | null>(null);

  // Load dashboard data on mount
  useEffect(() => {
    if (!isLoaded) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const meData = await apiRequest<MeResponse>("/api/me", "GET", token);
        setCompany(meData.company);

        if (meData.company) {
          const list = await apiRequest<InterviewSummary[]>(
            "/api/interviews",
            "GET",
            token
          );
          setInterviews(list);
          if (list.length > 0) {
            setSelectedInterviewId(list[0].id);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [getToken, isLoaded]);

  // Load selected interview detail for Candidate Invites view
  useEffect(() => {
    if (!isLoaded || !selectedInterviewId) return;
    if (activeTab !== "invites") return;

    let isMounted = true;

    async function loadDetail() {
      setLoadingDetail(true);
      try {
        const token = await getToken();
        if (!token) return;
        const detail = await apiRequest<InterviewDetailResponse>(
          `/api/interviews/${selectedInterviewId}`,
          "GET",
          token
        );
        if (isMounted) {
          setSelectedInterviewDetail(detail);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn("Could not load interview details:", err);
        }
      } finally {
        if (isMounted) {
          setLoadingDetail(false);
        }
      }
    }

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedInterviewId, activeTab, getToken, isLoaded]);

  // Show temporary banner notification
  function notifySuccess(message: string) {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  }

  // Handle creating a new company
  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setCreatingCompany(true);
    setError(null);
    try {
      const token = await getToken();
      const newCompany = await apiRequest<MeResponse["company"]>(
        "/api/companies",
        "POST",
        token,
        { name: companyName.trim() }
      );
      setCompany(newCompany);
      notifySuccess("Company workspace created successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setCreatingCompany(false);
    }
  }

  // Handle creating a new interview
  async function handleCreateInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!interviewTitle.trim()) return;

    const lines = questionsRaw.split("\n");
    const parsedQuestions: { text: string; rubric: string | null }[] = [];

    for (let i = 0; i < lines.length; i = i + 1) {
      const line = lines[i].trim();
      if (line.length > 0) {
        if (line.includes("||")) {
          const parts = line.split("||");
          parsedQuestions.push({
            text: parts[0].trim(),
            rubric: parts[1].trim() || null,
          });
        } else {
          parsedQuestions.push({
            text: line,
            rubric: null,
          });
        }
      }
    }

    if (parsedQuestions.length === 0) {
      setError("Please add at least one interview question.");
      return;
    }

    setCreatingInterview(true);
    setError(null);
    try {
      const token = await getToken();
      const expiresIso = new Date(expiresAt).toISOString();
      await apiRequest<InterviewSummary>("/api/interviews", "POST", token, {
        title: interviewTitle.trim(),
        questions: parsedQuestions,
        expires_at: expiresIso,
        time_limit_min: Number(timeLimitMin),
      });

      const updatedList = await apiRequest<InterviewSummary[]>(
        "/api/interviews",
        "GET",
        token
      );
      setInterviews(updatedList);
      setInterviewTitle("");
      notifySuccess("Interview created successfully!");
      setActiveTab("interviews");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create interview");
    } finally {
      setCreatingInterview(false);
    }
  }

  // Handle deleting an interview
  async function handleDeleteInterview(interviewId: string) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this interview and all its candidate attempts?"
    );
    if (!shouldDelete) return;

    setDeletingId(interviewId);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/interviews/${interviewId}`, "DELETE", token);
      setInterviews((prev) => prev.filter((item) => item.id !== interviewId));
      notifySuccess("Interview deleted successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete interview");
    } finally {
      setDeletingId(null);
    }
  }

  // Handle sending invites
  async function handleSendInvites(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInterviewId || !inviteEmailsText.trim()) return;

    const rawEmails = inviteEmailsText.split(/[\n,]+/);
    const cleanEmails: string[] = [];
    for (let i = 0; i < rawEmails.length; i = i + 1) {
      const email = rawEmails[i].trim();
      if (email.length > 0 && email.includes("@")) {
        cleanEmails.push(email);
      }
    }

    if (cleanEmails.length === 0) {
      setError("Please enter valid candidate email addresses.");
      return;
    }

    setSendingInvites(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await apiRequest<InviteResponse>(
        `/api/interviews/${selectedInterviewId}/invites`,
        "POST",
        token,
        { emails: cleanEmails }
      );
      setInviteResult(result);
      setInviteEmailsText("");
      notifySuccess(`Invited ${result.created.length} candidate(s)!`);

      const detail = await apiRequest<InterviewDetailResponse>(
        `/api/interviews/${selectedInterviewId}`,
        "GET",
        token
      );
      setSelectedInterviewDetail(detail);

      const updatedList = await apiRequest<InterviewSummary[]>(
        "/api/interviews",
        "GET",
        token
      );
      setInterviews(updatedList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invites");
    } finally {
      setSendingInvites(false);
    }
  }

  // Copy candidate link
  function handleCopyLink(attemptId: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/interview/${attemptId}`;
    navigator.clipboard.writeText(url);
    setCopiedAttemptId(attemptId);
    setTimeout(() => {
      setCopiedAttemptId(null);
    }, 2000);
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-950 dark:border-t-white rounded-full animate-spin" />
        <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Loading workspace…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
      {/* Error and Success Notifications */}
      {error && (
        <div className="mb-6 border-l-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 p-3 text-[12px] flex items-center justify-between">
          <span className="font-mono">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[11px] uppercase tracking-wider font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 border-l-2 border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 text-[12px] flex items-center justify-between">
          <span className="font-mono">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[11px] uppercase tracking-wider font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Case 1: No company yet */}
      {!company ? (
        <CreateCompanyView
          companyName={companyName}
          setCompanyName={setCompanyName}
          creatingCompany={creatingCompany}
          onCreateCompany={handleCreateCompany}
        />
      ) : (
        /* Case 2: Company exists -> show Sidebar + Active Component */
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Sidebar
            companyName={company.name}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            interviewCount={interviews.length}
            userEmail={user?.primaryEmailAddress?.emailAddress || ""}
          />

          <main className="flex-1 w-full">
            {activeTab === "analytics" && (
              <AnalyticsView
                interviews={interviews}
                onGoToCreate={() => setActiveTab("create")}
                onGoToInvites={() => setActiveTab("invites")}
              />
            )}

            {activeTab === "interviews" && (
              <InterviewsView
                interviews={interviews}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                deletingId={deletingId}
                onDeleteInterview={handleDeleteInterview}
                onGoToCreate={() => setActiveTab("create")}
                onGoToInvites={(interviewId) => {
                  if (interviewId) {
                    setSelectedInterviewId(interviewId);
                  }
                  setActiveTab("invites");
                }}
              />
            )}

            {activeTab === "create" && (
              <CreateInterviewView
                title={interviewTitle}
                setTitle={setInterviewTitle}
                questionsRaw={questionsRaw}
                setQuestionsRaw={setQuestionsRaw}
                timeLimitMin={timeLimitMin}
                setTimeLimitMin={setTimeLimitMin}
                expiresAt={expiresAt}
                setExpiresAt={setExpiresAt}
                creatingInterview={creatingInterview}
                onCreateInterview={handleCreateInterview}
                onCancel={() => setActiveTab("interviews")}
              />
            )}

            {activeTab === "invites" && (
              <CandidateInvitesView
                interviews={interviews}
                selectedInterviewId={selectedInterviewId}
                setSelectedInterviewId={setSelectedInterviewId}
                selectedInterviewDetail={selectedInterviewDetail}
                loadingDetail={loadingDetail}
                inviteEmailsText={inviteEmailsText}
                setInviteEmailsText={setInviteEmailsText}
                sendingInvites={sendingInvites}
                inviteResult={inviteResult}
                copiedAttemptId={copiedAttemptId}
                onSendInvites={handleSendInvites}
                onCopyLink={handleCopyLink}
                onGoToCreate={() => setActiveTab("create")}
              />
            )}

            {activeTab === "attempts" && (
              <CandidatesAttemptsView
                onGoToInvites={(interviewId) => {
                  if (interviewId) {
                    setSelectedInterviewId(interviewId);
                  }
                  setActiveTab("invites");
                }}
              />
            )}

            {activeTab === "company" && (
              <CompanyProfileView
                company={company}
                userEmail={user?.primaryEmailAddress?.emailAddress || ""}
                userName={user?.fullName || ""}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
