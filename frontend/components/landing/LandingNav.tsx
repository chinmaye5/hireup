// Anchor links for signed-out visitors. Add to app/layout.tsx (see notes).
const links = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Capabilities" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export default function LandingNav() {
  return (
    <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="px-3 py-1.5 text-[13px] font-medium text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}
