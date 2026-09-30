"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children?: React.ReactNode;
}) {
  const Icon = { error: AlertTriangle, success: CheckCircle2, info: Info }[tone];
  return (
    <AnimatePresence initial={false}>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-sm border px-3.5 py-3 text-[13.5px] leading-relaxed",
              {
                error: "border-critical/25 bg-critical/10 text-critical",
                success: "border-positive/25 bg-positive/10 text-positive",
                info: "border-aqua-400/25 bg-aqua-500/10 text-aqua-600",
              }[tone],
            )}
          >
            <Icon className="mt-px size-4 shrink-0" />
            <span>{children}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
