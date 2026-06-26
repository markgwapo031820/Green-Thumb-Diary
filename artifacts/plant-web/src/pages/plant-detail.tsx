import { Layout } from "@/components/layout";
import { useGetPlant, useListPlantLogs, useWaterPlant, useDeletePlant, getGetPlantQueryKey, getListPlantsQueryKey, getGetStatsQueryKey, getGetActivityQueryKey, getListPlantLogsQueryKey, useDeletePlantLog } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computePlantStatus } from "@/components/plant-card";
import { StatusBadge } from "@/components/status-badge";
import { Droplet, Calendar, Edit2, Trash2, ArrowLeft, Plus, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PlantDetail() {
  const [, params] = useRoute("/plants/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plant, isLoading: isPlantLoading } = useGetPlant(id, {
    query: { enabled: !!id, queryKey: getGetPlantQueryKey(id) }
  });

  const { data: logs, isLoading: isLogsLoading } = useListPlantLogs(id, {
    query: { enabled: !!id, queryKey: getListPlantLogsQueryKey(id) }
  });

  const waterPlant = useWaterPlant();
  const deletePlant = useDeletePlant();
  const deleteLog = useDeletePlantLog();

  const handleWater = () => {
    waterPlant.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "Plant watered!",
          description: "Watering recorded successfully.",
        });
        queryClient.invalidateQueries({ queryKey: getGetPlantQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetActivityQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to record watering.",
        });
      }
    });
  };

  const handleDelete = () => {
    deletePlant.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "Plant deleted",
          description: "The plant has been removed from your garden.",
        });
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        setLocation("/");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete plant.",
        });
      }
    });
  };

  const handleDeleteLog = (logId: number) => {
    deleteLog.mutate({ plantId: id, logId }, {
      onSuccess: () => {
        toast({ title: "Log deleted" });
        queryClient.invalidateQueries({ queryKey: getListPlantLogsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetActivityQueryKey() });
      }
    });
  };

  if (isPlantLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif font-medium mb-2">Plant not found</h2>
          <Button asChild><Link href="/">Return to Garden</Link></Button>
        </div>
      </Layout>
    );
  }

  const { status } = computePlantStatus(plant);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Garden
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="overflow-hidden rounded-2xl border-4 border-card/50 shadow-sm relative group">
              <AspectRatio ratio={4/5} className="bg-muted">
                {plant.photo ? (
                  <img src={plant.photo} alt={plant.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-secondary/50">
                    <ImageIcon className="w-16 h-16 mb-4 stroke-[1.5]" />
                    <span className="text-sm font-medium uppercase tracking-widest">No Photo</span>
                  </div>
                )}
              </AspectRatio>
              <div className="absolute top-4 right-4">
                <StatusBadge status={status} className="shadow-sm backdrop-blur-md bg-background/80" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleWater} 
                disabled={waterPlant.isPending}
                size="lg"
                className="flex-1 rounded-xl text-md h-14 bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm"
              >
                <Droplet className="w-5 h-5 mr-2" />
                Mark as Watered
              </Button>
            </div>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-medium text-foreground">{plant.name}</h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" asChild className="rounded-full">
                    <Link href={`/plants/${plant.id}/edit`}>
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {plant.name} and all of its growth logs.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Plant
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-xl text-muted-foreground italic font-serif">{plant.species}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Watering</p>
                    <p className="font-medium">Every {plant.wateringFrequencyDays} days</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last Watered</p>
                    <p className="font-medium">
                      {plant.lastWatered ? formatDistanceToNow(new Date(plant.lastWatered), { addSuffix: true }) : "Never"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-medium">Growth Journal</h3>
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link href={`/plants/${plant.id}/logs/new`}>
                    <Plus className="w-4 h-4 mr-2" /> Add Entry
                  </Link>
                </Button>
              </div>

              {isLogsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center py-8 bg-card/30 rounded-xl border border-dashed border-border/50">
                  <p className="text-muted-foreground text-sm">No journal entries yet.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-primary/20 ml-3 pl-6 space-y-8">
                  {logs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-primary bg-background" />
                      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm group">
                        <div className="flex justify-between items-start mb-2">
                          <time className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                            {format(new Date(log.date), 'MMM d, yyyy')}
                          </time>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => handleDeleteLog(log.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm leading-relaxed">{log.notes}</p>
                        {log.photo && (
                          <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
                            <img src={log.photo} alt="Growth progress" className="w-full max-h-48 object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
