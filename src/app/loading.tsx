import { OrbitLoader } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <OrbitLoader label="Loading WeCanHelpWay…" />
    </div>
  );
}
