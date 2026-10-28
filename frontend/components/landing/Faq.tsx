import { Minus, Plus } from "lucide-react";
import { Container, Reveal, SectionHeader } from "./primitives";

const faqs = [
  {
    q: "Do candidates need to install anything?",
    a: "No. The interview runs in the browser and needs a microphone, nothing else. No camera and no download. Candidates sign in with the email address you invited, so the link can’t be used by someone else.",
  },
  {
    q: "How does scoring work?",
    a: "Each answer is scored against the rubric you wrote for that question. You get a 0–10 score and a note per question, an overall score, strengths, areas for growth and a recommendation. You can re-score any attempt later.",
  },
  {
    q: "Does the AI make the hiring decision?",
    a: "No. HireUp gives you a recommendation and the evidence behind it: scores, notes and the full transcript. The decision stays with your team.",
  },
  {
    q: "Can a candidate retry?",
    a: "Yes. Reset an attempt from the interview page and the same link works again. You can also delete an invite entirely.",
  },
  {
    q: "How long can an interview be?",
    a: "Set a time limit from 5 to 60 minutes, with up to 10 questions per interview. The link expires on the date you choose.",
  },
  {
    q: "What roles does it work for?",
    a: "Any role where you can write questions and a rubric for spoken answers. Start from the built-in frontend, backend or full-stack templates, or write your own from scratch.",
  },
  {
    q: "How many candidates can I invite at once?",
    a: "Up to 50 email addresses per batch. Paste them one per line or separated by commas.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-b border-foreground/10 py-24 md:py-32">
      <Container>
        <SectionHeader index="06" label="FAQ" title="Questions, answered." />
        <Reveal>
          <div className="md:grid md:grid-cols-12">
            <div className="border-t border-foreground/30 md:col-span-9 md:col-start-4">
              {faqs.map((f) => (
                <details key={f.q} className="group border-b border-foreground/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Plus className="h-4 w-4 shrink-0 group-open:hidden" aria-hidden="true" />
                    <Minus className="hidden h-4 w-4 shrink-0 group-open:block" aria-hidden="true" />
                  </summary>
                  <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-foreground/65">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
