"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Container, Reveal, SectionHeader, VoiceBars } from "./primitives";

/* ------------------------------------------------------------------ */
/* Mock app screens (always dark, like the hero). Sample data only.    */
/* ------------------------------------------------------------------ */

function Window({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-white/15 bg-neutral-950 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2 w-2 border border-white/30" />
        <span className="h-2 w-2 border border-white/30" />
        <span className="h-2 w-2 border border-white/30" />
        <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">{title}</span>
      </div>
      <div className="min-h-[430px] p-5 sm:p-6">{children}</div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">{children}</p>
  );
}

function MockWrite() {
  const qs = [
    ["Walk me through a service you built and how you scaled it.", "Ownership, trade-offs, concrete numbers"],
    ["Explain synchronous vs asynchronous execution.", "Event loop, non-blocking I/O"],
    ["Describe a production bug you tracked down.", "Systematic debugging"],
  ];
  return (
    <div className="space-y-5">
      <div>
        <Label>Role</Label>
        <div className="border border-white/15 px-3 py-2 text-sm">Backend Engineer</div>
      </div>
      <div>
        <Label>Questions and rubric</Label>
        <ol className="divide-y divide-white/10 border border-white/15">
          {qs.map(([q, r], i) => (
            <li key={q} className="flex gap-4 p-3.5">
              <span className="pt-0.5 font-mono text-[11px] text-white/40">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-sm">{q}</p>
                <p className="mt-1 text-xs text-white/50">Rubric: {r}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex gap-6 text-xs text-white/60">
          <span>
            Time limit <span className="font-medium text-white">20 min</span>
          </span>
          <span>
            Expires <span className="font-medium text-white">30 Nov</span>
          </span>
        </div>
        <span className="bg-white px-4 py-2 text-xs font-medium text-neutral-950">Save interview</span>
      </div>
    </div>
  );
}

function MockInvite() {
  const rows: [string, string, string][] = [
    ["ananya@example.com", "Scored", "bg-white"],
    ["rahul@example.com", "In progress", "bg-white/60 motion-safe:animate-pulse"],
    ["priya@example.com", "Invited", "border border-white/50"],
  ];
  return (
    <div className="space-y-5">
      <div>
        <Label>Candidate emails</Label>
        <div className="border border-white/15 p-3 font-mono text-xs leading-relaxed text-white/80">
          ananya@example.com
          <br />
          rahul@example.com
          <br />
          priya@example.com
        </div>
        <span className="mt-3 inline-block bg-white px-4 py-2 text-xs font-medium text-neutral-950">
          Send 3 invitations
        </span>
      </div>
      <div>
        <Label>Candidates</Label>
        <ul className="divide-y divide-white/10 border border-white/15">
          {rows.map(([email, status, mark]) => (
            <li key={email} className="flex items-center justify-between gap-3 p-3.5 text-sm">
              <span className="truncate">{email}</span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="flex items-center gap-2 text-xs text-white/70">
                  <span className={cn("h-2 w-2", mark)} />
                  {status}
                </span>
                <span className="border border-white/20 px-2 py-1 text-[11px] text-white/70">Copy link</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-white/40">
          Each link only works for the email it was sent to.
        </p>
      </div>
    </div>
  );
}

function MockLive() {
  return (
    <div className="flex h-full min-h-[380px] flex-col justify-between gap-6">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">
        <span>Question 2 of 4</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-white motion-safe:animate-pulse" />
          Live · 12:40 left
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-4 border border-white/40 bg-white/[0.04] px-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center border border-white/30 text-sm font-medium">
            AI
          </div>
          <VoiceBars className="text-white" />
          <p className="text-xs text-white/60">AI Interviewer · Speaking</p>
        </div>
        <div className="flex flex-col items-center gap-4 border border-white/10 px-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center border border-white/15 text-sm font-medium text-white/60">
            A
          </div>
          <VoiceBars active={false} className="text-white/40" />
          <p className="text-xs text-white/40">Candidate · Listening</p>
        </div>
      </div>

      <p className="border-t border-white/10 pt-4 text-sm leading-relaxed text-white/80">
        “Explain the difference between synchronous and asynchronous execution, and where an event loop fits in.”
      </p>
    </div>
  );
}

function MockReport() {
  const qs: [string, number][] = [
    ["Q1  Scaling a service", 9],
    ["Q2  Async execution", 8],
    ["Q3  Debugging", 7],
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs text-white/50">ananya@example.com · Backend Engineer</p>
          <p className="mt-2 inline-block border border-white/30 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]">
            Strong yes
          </p>
        </div>
        <p className="text-5xl font-semibold tabular-nums tracking-tight">
          8.0<span className="ml-1 text-base font-normal text-white/40">/10</span>
        </p>
      </div>

      <ul className="space-y-3">
        {qs.map(([name, score]) => (
          <li key={name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="text-white/80">{name}</span>
            <span className="tabular-nums text-white/60">{score}/10</span>
            <span className="col-span-2 block h-1 bg-white/10">
              <span className="block h-full bg-white" style={{ width: `${score * 10}%` }} />
            </span>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 border-t border-white/10 pt-5 text-xs sm:grid-cols-2">
        <div>
          <Label>Strengths</Label>
          <p className="leading-relaxed text-white/70">Clear ownership of past work. Explains trade-offs with real numbers.</p>
        </div>
        <div>
          <Label>Areas for growth</Label>
          <p className="leading-relaxed text-white/70">Debugging answer stayed high level. Could be more systematic.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const steps = [
  {
    id: "write",
    index: "01",
    title: "Write the interview",
    body: "Add up to ten questions and a rubric for each. Start from a frontend, backend or full-stack template, or write your own.",
    window: "New interview",
    mock: <MockWrite />,
  },
  {
    id: "invite",
    index: "02",
    title: "Invite candidates",
    body: "Paste a batch of emails. Every candidate gets a private link that only works for the address you invited.",
    window: "Invitations",
    mock: <MockInvite />,
  },
  {
    id: "interview",
    index: "03",
    title: "They talk, the AI listens",
    body: "Candidates open the link, allow their microphone and answer out loud. The interviewer asks your questions in order.",
    window: "Live interview",
    mock: <MockLive />,
  },
  {
    id: "review",
    index: "04",
    title: "Review the scorecard",
    body: "Get an overall score, per-question notes, strengths, areas for growth, a recommendation and the full transcript.",
    window: "Sample report",
    mock: <MockReport />,
  },
];

const INTERVAL_MS = 6500;

export default function ProductTour() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, reduce, active]);

  const current = steps[active];

  return (
    <section id="product" className="scroll-mt-16 border-b border-foreground/10 py-24 md:py-32">
      <Container>
        <SectionHeader
          index="01"
          label="Product tour"
          title="From a list of questions to a ranked shortlist."
          description="Four steps, one link per candidate. Here is what each one looks like."
        />

        <Reveal>
          <div
            className="grid gap-10 lg:grid-cols-12 lg:gap-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div role="tablist" aria-label="Product tour" className="flex flex-col lg:col-span-5">
              {steps.map((s, i) => {
                const selected = i === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    id={`tab-${s.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${s.id}`}
                    onClick={() => setActive(i)}
                    className={cn(
                      "border-l-2 py-5 pl-6 text-left transition-colors",
                      selected
                        ? "border-foreground"
                        : "border-foreground/10 text-foreground/50 hover:border-foreground/40 hover:text-foreground/80"
                    )}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[11px] tracking-[0.12em] text-foreground/40">{s.index}</span>
                      <span className="text-lg font-semibold tracking-tight sm:text-xl">{s.title}</span>
                    </span>
                    {selected && (
                      <span className="mt-3 block max-w-md pl-9 text-[15px] leading-relaxed text-foreground/65">
                        {s.body}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7" role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
                >
                  <Window title={current.window}>{current.mock}</Window>
                </motion.div>
              </AnimatePresence>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/40">
                Illustrative screens with sample data
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
