"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/misc";
import { ConnectionCard } from "./connection-card";
import type { ConnectionView } from "@/actions/connections";

export function ConnectionsBoard({ connections }: { connections: ConnectionView[] }) {
  const [tab, setTab] = React.useState("awaiting");
  const router = useRouter();

  // The other party's answer lands here without a refresh.
  React.useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("connections-board")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "connections" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const awaiting = connections.filter(
    (c) => c.my_response === "pending" && ["proposed", "partially_accepted"].includes(c.status),
  );
  const live = connections.filter((c) => c.status === "connected");
  const pendingOther = connections.filter(
    (c) => c.my_response === "accepted" && c.status === "partially_accepted",
  );
  const past = connections.filter((c) => ["declined", "cancelled", "completed"].includes(c.status));

  const groups: Record<string, ConnectionView[]> = {
    awaiting,
    waiting: pendingOther,
    live,
    past,
    all: connections,
  };

  const shown = groups[tab] ?? connections;

  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "awaiting", label: "Waiting on you", count: awaiting.length },
          { value: "live", label: "Connected", count: live.length },
          { value: "waiting", label: "Waiting on them", count: pendingOther.length },
          { value: "past", label: "Past", count: past.length },
          { value: "all", label: "All", count: connections.length },
        ]}
      />

      <div className="mt-6 space-y-4">
        {shown.map((connection) => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
        {shown.length === 0 && (
          <p className="py-14 text-center text-[13.5px] text-ink/50">Nothing in this view.</p>
        )}
      </div>
    </div>
  );
}
