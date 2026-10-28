import { Container, Reveal } from "./primitives";

const specs = [
  { value: "5–60", unit: "min", label: "Interview length, set by you" },
  { value: "1–10", unit: "", label: "Questions, asked in the order you write them" },
  { value: "0–10", unit: "", label: "Score for every answer, against your rubric" },
  { value: "50", unit: "", label: "Candidates per invite batch" },
];

const stack = ["LiveKit WebRTC", "Silero VAD", "Groq Whisper", "Deepgram Aura"];

export default function AtAGlance() {
  return (
    <section aria-label="At a glance" className="border-b border-foreground/10">
      <Container>
        <Reveal>
          <div className="grid grid-cols-2 border-l border-t border-foreground/10 md:grid-cols-4">
            {specs.map((s) => (
              <div key={s.label} className="border-b border-r border-foreground/10 p-6 md:p-8">
                <p className="text-4xl font-semibold tabular-nums tracking-tight md:text-6xl">
                  {s.value}
                  {s.unit && <span className="ml-1.5 text-base font-normal text-foreground/50">{s.unit}</span>}
                </p>
                <p className="mt-3 max-w-[22ch] text-sm leading-snug text-foreground/60">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 py-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/40">
              Built on
            </span>
            {stack.map((name) => (
              <span key={name} className="font-mono text-[12px] tracking-tight text-foreground/70">
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
