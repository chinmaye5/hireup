import { Check } from "lucide-react";
import CtaButtons from "./CtaButtons";
import { Container, MonoLabel, Reveal, SectionHeader } from "./primitives";

const included = [
  "Voice interviews with an AI interviewer",
  "Custom questions with a rubric for each",
  "Frontend, backend and full-stack templates",
  "Private links tied to each candidate’s email",
  "Scores, recommendation, strengths and growth areas",
  "Full conversation transcripts",
  "Reset, delete and re-score controls",
  "Pipeline analytics across every role",
  "Time limits and expiry dates",
];

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-b border-foreground/10 py-24 md:py-32">
      <Container>
        <SectionHeader
          index="05"
          label="Pricing"
          title="Free while we’re in early access."
          description="The full product, no card required. We’ll tell you well before anything changes."
        />
        <Reveal>
          <div className="grid border border-foreground/15 lg:grid-cols-12">
            <div className="flex flex-col justify-between gap-12 border-b border-foreground/15 p-8 sm:p-10 lg:col-span-5 lg:border-b-0 lg:border-r">
              <div>
                <MonoLabel>Early access</MonoLabel>
                <p className="mt-6 text-6xl font-semibold tracking-tight sm:text-7xl">Free</p>
                <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-foreground/65">
                  Create interviews, invite candidates and review reports. No card needed to start.
                </p>
              </div>
              <CtaButtons tone="theme" />
            </div>

            <div className="p-8 sm:p-10 lg:col-span-7">
              <MonoLabel>Everything included</MonoLabel>
              <ul className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-snug">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
