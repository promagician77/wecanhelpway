import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listNotifications } from "@/actions/notifications";
import { unreadTotal } from "@/actions/messages";
import { listMyConnections } from "@/actions/connections";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { AuroraBackdrop } from "@/components/ui/backdrop";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // Fetch the shell's live counters in parallel — they gate nothing below.
  const [notifications, messageUnread, connections] = await Promise.all([
    listNotifications(30),
    unreadTotal(),
    listMyConnections(),
  ]);

  const awaitingMe = connections.filter(
    (c) => c.my_response === "pending" && ["proposed", "partially_accepted"].includes(c.status),
  ).length;

  return (
    <div className="relative flex min-h-dvh">
      <AuroraBackdrop intensity={0.45} className="fixed" />

      <Sidebar
        profile={session.profile}
        counters={{
          messages: messageUnread,
          notifications: notifications.filter((n) => !n.read_at).length,
          connections: awaitingMe,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={session.profile} initialNotifications={notifications} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
