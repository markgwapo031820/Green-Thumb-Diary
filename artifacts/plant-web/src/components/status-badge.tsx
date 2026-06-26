import { PlantHealthStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: PlantHealthStatus; className?: string }) {
  let label = "";
  let variantClass = "";

  switch (status) {
    case "good":
      label = "✅ Good";
      variantClass = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50";
      break;
    case "due-soon":
      label = "⚠️ Due Soon";
      variantClass = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50";
      break;
    case "overdue":
      label = "🚨 Overdue";
      variantClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50";
      break;
  }

  return (
    <Badge variant="outline" className={cn("font-medium", variantClass, className)}>
      {label}
    </Badge>
  );
}
