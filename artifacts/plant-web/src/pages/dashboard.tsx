import { useState, useMemo } from "react";
import { useListPlants } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { PlantCard, computePlantStatus } from "@/components/plant-card";
import { Input } from "@/components/ui/input";
import { Search, Sprout } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type StatusFilter = "all" | "good" | "due-soon" | "overdue";

export default function Dashboard() {
  const { data: plants, isLoading } = useListPlants();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredPlants = useMemo(() => {
    if (!plants) return [];
    return plants.filter((plant) => {
      const matchesSearch =
        plant.name.toLowerCase().includes(search.toLowerCase()) ||
        plant.species.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter !== "all") {
        const { status } = computePlantStatus(plant);
        return status === statusFilter;
      }
      return true;
    });
  }, [plants, search, statusFilter]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-serif tracking-tight font-medium text-foreground mb-2">
              My Garden
            </h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading plants..."
                : `You have ${plants?.length || 0} plants in your collection.`}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border/50 focus-visible:ring-primary/20"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[140px] bg-card border-border/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="good">✅ Good</SelectItem>
                <SelectItem value="due-soon">⚠️ Due Soon</SelectItem>
                <SelectItem value="overdue">🚨 Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[200px] rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card/50">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-2">No plants found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Your garden is empty. Add your first plant to start tracking its growth."}
            </p>
            {!search && statusFilter === "all" && (
              <Button asChild className="rounded-full px-6">
                <Link href="/plants/new">Add Your First Plant</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredPlants.map((plant, i) => (
              <PlantCard key={plant.id} plant={plant} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
