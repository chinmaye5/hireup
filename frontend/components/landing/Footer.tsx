import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Container } from "./primitives";

const product = [
  { href: "/#product", label: "Product tour" },
  { href: "/#features", label: "Capabilities" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const col = "mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/45";
const link = "text-sm text-foreground/70 transition-colors hover:text-foreground";

export default function Footer() {
  return (
    <footer className="border-t border-foreground/10">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center border border-foreground/20 bg-foreground text-background">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <rect x="3" y="9" width="3" height="6" />
                  <rect x="8" y="4" width="3" height="16" />
                  <rect x="13" y="7" width="3" height="10" />
                  <rect x="18" y="10" width="3" height="4" />
                </svg>
              </span>
              HireUp
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/60">
              AI voice interviews for hiring teams. Write the questions, send a link, review the scorecard.
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-8">
            <p className={col}>Product</p>
            <ul className="space-y-3">
              {product.map((p) => (
                <li key={p.href}>
                  <a href={p.href} className={link}>
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className={col}>Account</p>
            <ul className="space-y-3">
              <SignedIn>
                <li>
                  <Link href="/dashboard" className={link}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/my-interviews" className={link}>
                    My Interviews
                  </Link>
                </li>
              </SignedIn>
              <SignedOut>
                <li>
                  <SignInButton mode="modal">
                    <button type="button" className={link}>
                      Sign In
                    </button>
                  </SignInButton>
                </li>
                <li>
                  <SignUpButton mode="modal">
                    <button type="button" className={link}>
                      Get Started
                    </button>
                  </SignUpButton>
                </li>
              </SignedOut>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6 text-xs text-foreground/45">
          <span>© {new Date().getFullYear()} HireUp</span>
          <span className="font-mono uppercase tracking-[0.12em]">Voice interviews, scored</span>
        </div>
      </Container>
    </footer>
  );
}
