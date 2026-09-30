import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/marketing/logo";
import { Avatar } from "@/components/ui/misc";
import { AuroraBackdrop } from "@/components/ui/backdrop";
import { signOut } from "@/actions/auth";
import { LogOut, ArrowLeft } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="relative min-h-dvh">
      <AuroraBackdrop intensity={0.3} className="fixed" />

      <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-void/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 sm:px-7">
          <Link href="/admin" className="flex shrink-0 items-center gap-3">
            <Logo compact />
            <span className="hidden text-[13px] font-semibold tracking-[-0.01em] text-ink/85 sm:block">
              Team Dashboard
            </span>
          </Link>

          <AdminNav />

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-ink/62 transition-all hover:border-ink/20 hover:text-ink sm:inline-flex"
            >
              <ArrowLeft className="size-3.5" />
              My account
            </Link>
            <Avatar src={profile.avatar_url} name={profile.full_name} size={34} ring />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="grid size-9 place-items-center rounded-xs text-ink/50 transition-colors hover:bg-critical/12 hover:text-critical"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-7 sm:py-10">{children}</main>
    </div>
  );
}
