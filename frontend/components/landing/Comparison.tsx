import { Check, Minus } from "lucide-react";
import { Container, Reveal, SectionHeader } from "./primitives";

const rows = [
  ["Scheduling", "Back-and-forth over calendars", "None. Candidates open a link"],
  ["Consistency", "Varies by interviewer and by day", "Same questions, same order, same rubric"],
  ["Candidate timing", "A fixed slot", "Any time before the link expires"],
  ["Your time", "Live for every candidate", "Review a scorecard when it’s done"],
  ["Record", "Notes, if someone took them", "Full transcript and per-question scores"],
  ["Comparing candidates", "From memory and notes", "Side by side by score and recommendation"],
];

export default function Comparison() {
  return (
    <section id="comparison" className="scroll-mt-16 border-b border-foreground/10 py-24 md:py-32">
      <Container>
        <SectionHeader
          index="04"
          label="Comparison"
          title="A live phone screen, without the calendar."
          description="What changes when the first round runs itself."
        />
        <Reveal>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-foreground/30 text-sm">
                  <th scope="col" className="w-1/4 py-4 pr-4 font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-foreground/45">
                    &nbsp;
                  </th>
                  <th scope="col" className="w-[34%] py-4 pr-4 font-medium text-foreground/55">
                    Live phone screen
                  </th>
                  <th scope="col" className="bg-foreground/[0.04] px-5 py-4 font-semibold">
                    HireUp
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, before, after]) => (
                  <tr key={label} className="border-b border-foreground/10">
                    <th scope="row" className="py-5 pr-4 text-sm font-medium">
                      {label}
                    </th>
                    <td className="py-5 pr-4 text-[15px] text-foreground/55">
                      <span className="flex items-start gap-3">
                        <Minus className="mt-1 h-3.5 w-3.5 shrink-0 text-foreground/35" aria-hidden="true" />
                        {before}
                      </span>
                    </td>
                    <td className="bg-foreground/[0.04] px-5 py-5 text-[15px]">
                      <span className="flex items-start gap-3">
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {after}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
