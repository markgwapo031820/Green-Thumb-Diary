import { Link } from "wouter";
import { Droplet, Calendar, Image as ImageIcon } from "lucide-react";
import { Plant, PlantHealthStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// We need a helper to compute status since the API list doesn't include it directly on the plant object
// Wait, the API returns lastWatered and wateringFrequencyDays.
export function computePlantStatus(plant: Plant): { status: PlantHealthStatus; daysUntil: number } {
  if (!plant.lastWatered) {
    return { status: "overdue", daysUntil: -1 };
  }
  const lastWateredDate = new Date(plant.lastWatered);
  const nextWateringDate = new Date(lastWateredDate);
  nextWateringDate.setDate(nextWateringDate.getDate() + plant.wateringFrequencyDays);
  
  const now = new Date();
  const diffTime = nextWateringDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: "overdue", daysUntil: diffDays };
  if (diffDays <= 2) return { status: "due-soon", daysUntil: diffDays };
  return { status: "good", daysUntil: diffDays };
}

export function PlantCard({ plant, index }: { plant: Plant; index: number }) {
  const { status, daysUntil } = computePlantStatus(plant);
  
  return (
    <Link href={`/plants/${plant.id}`}>
      <Card className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30 active:scale-[0.98]",
        "animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      )}
      style={{ animationDelay: `${index * 50}ms` }}>
        <div className="relative">
          <AspectRatio ratio={4/3} className="bg-muted">
            {plant.photo ? (
              <img 
                src={plant.photo} 
                alt={plant.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 transition-colors duration-300 group-hover:text-primary/40 bg-secondary/50">
                <ImageIcon className="w-12 h-12 mb-2 stroke-[1.5]" />
                <span className="text-xs font-medium uppercase tracking-widest">No Photo</span>
              </div>
            )}
          </AspectRatio>
          <div className="absolute top-3 right-3 shadow-sm rounded-full bg-background/80 backdrop-blur-md">
            <StatusBadge status={status} />
          </div>
        </div>
        
        <CardContent className="p-5">
          <div className="mb-4">
            <h3 className="font-serif text-xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {plant.name}
            </h3>
            <p className="text-sm text-muted-foreground italic line-clamp-1">{plant.species}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5" title="Watering Schedule">
              <Droplet className="w-4 h-4 text-primary/70" />
              <span>Every {plant.wateringFrequencyDays}d</span>
            </div>
            
            <div className="flex items-center gap-1.5" title="Last Watered">
              <Calendar className="w-4 h-4 text-primary/70" />
              <span>
                {plant.lastWatered 
                  ? formatDistanceToNow(new Date(plant.lastWatered), { addSuffix: true })
                  : "Never"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
