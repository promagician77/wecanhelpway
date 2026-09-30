"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ShieldCheck } from "lucide-react";
import { setAccountStatus, setUserRole } from "@/actions/admin";
import { Avatar, Tabs } from "@/components/ui/misc";
import { Badge, SpotlightCard, useToast } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { relativeTime } from "@/lib/utils";
import type { AccountStatus, Profile } from "@/lib/types";

const STATUS_TONE: Record<AccountStatus, "success" | "warn" | "danger" | "neutral"> = {
  active: "success",
  pending: "warn",
  suspended: "danger",
  deactivated: "neutral",
};

export function AdminUsersTable({
  profiles,
  currentUserId,
  needCounts,
  offerCounts,
  initialQuery,
}: {
  profiles: Profile[];
  currentUserId: string;
  needCounts: Record<string, number>;
  offerCounts: Record<string, number>;
  initialQuery: string;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [tab, setTab] = React.useState("all");
  const { push } = useToast();
  const router = useRouter();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles
      .filter((p) => (tab === "admins" ? p.role === "admin" : tab === "suspended" ? p.account_status !== "active" : true))
      .filter(
        (p) =>
          !q ||
          (p.full_name ?? "").toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          (p.country ?? "").toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q)),
      );
  }, [profiles, query, tab]);

  async function changeRole(userId: string, role: "user" | "admin") {
    const result = await setUserRole(userId, role);
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Role updated" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  async function changeStatus(userId: string, status: AccountStatus) {
    const result = await setAccountStatus(userId, status);
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Status updated" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "Everyone", count: profiles.length },
            { value: "admins", label: "Team", count: profiles.filter((p) => p.role === "admin").length },
            {
              value: "suspended",
              label: "Not active",
              count: profiles.filter((p) => p.account_status !== "active").length,
            },
          ]}
        />
        <Input
          placeholder="Search name, email, country, skill…"
          icon={<Search />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="ml-auto min-w-[16rem] flex-1 sm:flex-none sm:w-80"
        />
      </div>

      <div className="mt-6 space-y-2">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.25) }}
          >
            <SpotlightCard className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={p.avatar_url} name={p.full_name} size={44} ring={p.role === "admin"} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-ink/90">
                      {p.full_name ?? "Unnamed"}
                    </p>
                    {p.role === "admin" && (
                      <Badge tone="progress" icon={<ShieldCheck />}>
                        Team
                      </Badge>
                    )}
                    <Badge tone={STATUS_TONE[p.account_status]}>{p.account_status}</Badge>
                    {p.phone_verified && <Badge tone="info">phone verified</Badge>}
                  </div>
                  <p className="mt-1 truncate text-[12px] text-ink/50">{p.email}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-ink/50">
                    {p.country && <span>{p.country}</span>}
                    <span>{needCounts[p.id] ?? 0} requests</span>
                    <span>{offerCounts[p.id] ?? 0} offers</span>
                    <span className="font-mono">joined {relativeTime(p.created_at)}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Select
                    value={p.role}
                    disabled={p.id === currentUserId}
                    onChange={(e) => changeRole(p.id, e.target.value as "user" | "admin")}
                    wrapperClassName="w-32"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Select>
                  <Select
                    value={p.account_status}
                    disabled={p.id === currentUserId}
                    onChange={(e) => changeStatus(p.id, e.target.value as AccountStatus)}
                    wrapperClassName="w-36"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="deactivated">Deactivated</option>
                  </Select>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-[13.5px] text-ink/50">Nobody matches that search.</p>
      )}
    </div>
  );
}
