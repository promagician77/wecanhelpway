import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#need", label: "I need help" },
      { href: "/#offer", label: "I want to help" },
      { href: "/#stories", label: "Stories" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-up", label: "Create account" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/forgot-password", label: "Reset password" },
      { href: "/forgot-password?mode=recovery", label: "Account recovery" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative bg-sand/70">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-7">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-ink/65">
              Tell us what you need — even if you can&apos;t name it yet. A real person finds someone
              who can help, and you both agree before anyone talks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-[13px] font-semibold text-ink">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[14.5px] text-ink/65 transition-colors hover:text-brand-700"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink/[0.08] pt-7">
          <p className="text-[13.5px] text-ink/60">
            © {new Date().getFullYear()} WeCanHelpWay. Built for people who need a hand, and people
            who have one to give.
          </p>
          <p className="inline-flex items-center gap-2 text-[13.5px] text-ink/60">
            Made with care for people finding their way
          </p>
        </div>
      </div>
    </footer>
  );
}
