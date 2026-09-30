"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { value: string; label: string; icon: string; hint: string };

/**
 * Category grid. The "I'm not sure" option is given the same visual weight as
 * every other choice — deliberately. Nobody should feel they failed a form
 * because they can't name their own problem.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  name,
}: {
  categories: readonly Category[];
  value: string;
  onChange: (v: string) => void;
  name?: string;
}) {
  return (
    <div>
      {name && <input type="hidden" name={name} value={value} />}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {categories.map((c, i) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[c.icon] ?? Icons.CircleHelp;
          const selected = value === c.value;
          const highlight = c.value === "not_sure";

          return (
            <motion.button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.35 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                "group relative overflow-hidden rounded-sm border p-4 text-left transition-all duration-300",
                selected
                  ? "border-brand-400/80 bg-[linear-gradient(180deg,rgb(91_139_108/0.14),rgb(91_139_108/0.05))] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_4px_rgb(91_139_108/0.12)]"
                  : "material hover:border-ink/20",
                highlight && !selected && "border-ink/20",
              )}
            >

              <div className="relative flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xs border transition-colors duration-300",
                    selected
                      ? "skin-accent"
                      : "border-ink/[0.08] bg-ink/[0.04] text-ink/58 group-hover:text-ink",
                  )}
                >
                  <Icon className="size-[17px]" />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[13.5px] font-medium leading-snug transition-colors",
                      selected ? "text-ink" : "text-ink/80 group-hover:text-ink",
                    )}
                  >
                    {c.label}
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-relaxed text-ink/50">{c.hint}</span>
                </span>

                <motion.span
                  initial={false}
                  animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 26 }}
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-snow text-void"
                >
                  <Icons.Check className="size-3" strokeWidth={3.5} />
                </motion.span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
