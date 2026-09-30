"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { setOfferPaused } from "@/actions/offers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/feedback";

export function OfferPauseToggle({ offerId, paused }: { offerId: string; paused: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const { push } = useToast();
  const router = useRouter();

  return (
    <Button
      variant="glass"
      size="sm"
      magnetic={false}
      loading={busy}
      icon={paused ? <Play /> : <Pause />}
      onClick={async () => {
        setBusy(true);
        const result = await setOfferPaused(offerId, !paused);
        setBusy(false);
        if (result.ok) {
          push({ tone: "success", title: result.message ?? "Updated" });
          router.refresh();
        } else {
          push({ tone: "danger", title: "That didn't work", description: result.error });
        }
      }}
    >
      {paused ? "Resume" : "Pause"}
    </Button>
  );
}
