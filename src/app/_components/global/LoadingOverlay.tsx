import { Spinner } from "@heroui/react";

export default function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
      <div className="flex items-center gap-3 text-primary">
        <Spinner size="sm" color="primary" />
        <span className="text-lg font-medium">{label}</span>
      </div>
    </div>
  );
}
