import Link from "next/link";

const links = [
  { href: "/tracks", label: "Tracks" },
  { href: "/progress", label: "Progress" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-ink-edge">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-tight">StackWise</span>
          <span className="eyebrow text-sky">learn by doing</span>
        </Link>
        <nav>
          <ul className="flex gap-5 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream-muted transition-colors hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
