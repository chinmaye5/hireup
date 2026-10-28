import type { ReactNode } from "react";
import { ChartColumn, Lock, Mic, SlidersHorizontal, ScrollText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, Reveal, SectionHeader, VoiceBars } from "./primitives";

function Cell({
  icon: Icon,
  title,
  body,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-10 border-b border-r border-foreground/10 p-7 transition-colors hover:bg-foreground/[0.03] sm:p-8",
        className
      )}
    >
      <div>
        <div className="flex h-9 w-9 items-center justify-center border border-foreground/15">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="mt-6 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-foreground/65">{body}</p>
      </div>
      {children}
    </div>
  );
}

const chip = "border border-foreground/15 px-2.5 py-1 font-mono text-[11px] tracking-tight text-foreground/70";

export default function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-b border-foreground/10 py-24 md:py-32">
      <Container>
        <SectionHeader
          index="02"
          label="Capabilities"
          title="Everything the first round needs."
          description="A voice interviewer, a scoring rubric and a report you can act on, without the scheduling."
        />

        <Reveal>
          <div className="grid border-l border-t border-foreground/10 md:grid-cols-3">
            <Cell
              icon={Mic}
              title="A voice interviewer, not a chatbot"
              body="Candidates speak naturally and the interviewer responds in real time. Speech detection lets them finish a thought without being cut off."
              className="md:col-span-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <VoiceBars count={21} className="text-foreground/80" />
                <div className="flex flex-wrap gap-2">
                  {["WebRTC audio", "Voice activity detection", "Live transcription"].map((t) => (
                    <span key={t} className={chip}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Cell>

            <Cell
              icon={ScrollText}
              title="Scored against your rubric"
              body="Each answer gets a 0–10 score and a written note, judged against the rubric you wrote for that question."
            >
              <ul className="space-y-2.5">
                {[9, 8, 6].map((s, i) => (
                  <li key={i} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 text-xs text-foreground/60">
                    <span className="font-mono">Q{i + 1}</span>
                    <span className="block h-1 bg-foreground/10">
                      <span className="block h-full bg-foreground" style={{ width: `${s * 10}%` }} />
                    </span>
                    <span className="tabular-nums">{s}/10</span>
                  </li>
                ))}
              </ul>
            </Cell>

            <Cell
              icon={Lock}
              title="Private by design"
              body="Every candidate gets their own link. It only works after they sign in with the email you invited."
            >
              <p className="break-all border border-foreground/15 px-3 py-2 font-mono text-[11px] text-foreground/60">
                /interview/9c1e4b7a…
              </p>
            </Cell>

            <Cell
              icon={ScrollText}
              title="Reports you can act on"
              body="Overall score, strengths, areas for growth, a recommendation and the full conversation transcript."
            >
              <div className="flex flex-wrap gap-2">
                {["Strong yes", "Yes", "Maybe", "No"].map((t) => (
                  <span key={t} className={chip}>
                    {t}
                  </span>
                ))}
              </div>
            </Cell>

            <Cell
              icon={SlidersHorizontal}
              title="You stay in control"
              body="Set the time limit and expiry date. Reset an attempt so a candidate can retry, or re-score one any time."
            >
              <div className="flex flex-wrap gap-2">
                {["5–60 min limit", "Expiry date", "Reset attempt", "Re-score"].map((t) => (
                  <span key={t} className={chip}>
                    {t}
                  </span>
                ))}
              </div>
            </Cell>

            <Cell
              icon={ChartColumn}
              title="See the whole pipeline"
              body="Track how many candidates are invited, in progress and scored across every role, and open any report in one click."
              className="md:col-span-3"
            >
              <div>
                <div className="flex h-2.5 w-full">
                  <span className="h-full w-[28%] bg-foreground/20" />
                  <span className="h-full w-[17%] bg-foreground/50" />
                  <span className="h-full w-[55%] bg-foreground" />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/45">
                  <span>Invited</span>
                  <span>In progress</span>
                  <span>Scored</span>
                  <span className="text-foreground/30">Sample data</span>
                </div>
              </div>
            </Cell>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
