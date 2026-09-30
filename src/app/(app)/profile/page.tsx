import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/app/page-header";
import { ProfileEditor } from "@/components/app/profile-editor";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const { profile, user } = await requireUser();

  // Which providers this account can sign in with — shown read-only.
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? ["email"];

  return (
    <PageShell className="max-w-4xl">
      <ProfileEditor profile={profile} providers={providers} />
    </PageShell>
  );
}
