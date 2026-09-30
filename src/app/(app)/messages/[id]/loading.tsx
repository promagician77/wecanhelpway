import { OrbitLoader } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="grid h-[calc(100dvh-4rem)] place-items-center">
      <OrbitLoader label="Opening the conversation…" />
    </div>
  );
}
