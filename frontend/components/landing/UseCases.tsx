import { Building2, GraduationCap, Rocket, type LucideIcon } from "lucide-react";
import { Container, Reveal, SectionHeader } from "./primitives";

const cases: { icon: LucideIcon; tag: string; title: string; body: string; points: string[] }[] = [
  {
    icon: Rocket,
    tag: "Startups and small teams",
    title: "Keep engineers building",
    body: "Screen first-round candidates without pulling anyone off product work to run another intro call.",
    points: ["Same questions for every applicant", "Review a scorecard, not a calendar"],
  },
  {
    icon: Building2,
    tag: "Recruiting agencies",
    title: "Screen at volume, consistently",
    body: "Run one interview per role and invite candidates in batches of up to 50, with the same rubric applied to everyone.",
    points: ["One link per candidate", "Scores that compare across a batch"],
  },
  {
    icon: GraduationCap,
    tag: "Campus and bulk hiring",
    title: "One drive, many candidates",
    body: "Let a whole cohort interview in their own time before the deadline and start from a ranked list.",
    points: ["Candidates join from a browser", "Links expire on the date you set"],
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-16 border-b border-foreground/10 py-24 md:py-32">
      <Container>
        <SectionHeader
          index="03"
          label="Who it’s for"
          title="Built for teams that screen at volume."
          description="If the first round is a pile of near-identical calls, that is the round HireUp takes over."
        />
        <Reveal>
          <div className="grid border-l border-t border-foreground/10 md:grid-cols-3">
            {cases.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.title} className="flex flex-col border-b border-r border-foreground/10 p-7 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border border-foreground/15">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/50">{c.tag}</p>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight">{c.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-foreground/65">{c.body}</p>
                  <ul className="mt-8 space-y-2 border-t border-foreground/10 pt-5 text-sm text-foreground/75">
                    {c.points.map((p) => (
                      <li key={p} className="flex gap-3">
                        <span className="mt-2 h-px w-3 shrink-0 bg-foreground/50" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
