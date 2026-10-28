import CtaButtons from "./CtaButtons";
import { Container, Reveal } from "./primitives";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      {/* hairline grid, same language as the rest of the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <Container className="relative py-24 md:py-36">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">Start now</p>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Run your first voice interview today.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Write your questions, send one link per candidate and review the scorecard when it’s done.
          </p>
          <div className="mt-10">
            <CtaButtons tone="dark" />
          </div>
          <p className="mt-6 text-sm text-white/45">No card required. Candidates only need a browser and a microphone.</p>
        </Reveal>
      </Container>
    </section>
  );
}
