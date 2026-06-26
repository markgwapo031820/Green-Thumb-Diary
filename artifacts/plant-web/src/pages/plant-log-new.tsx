import { Layout } from "@/components/layout";
import { useCreatePlantLog, useGetPlant, getGetPlantQueryKey, getListPlantLogsQueryKey, getGetStatsQueryKey, getGetActivityQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const logSchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  photo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  date: z.string().optional(),
});

export default function PlantLogNew() {
  const [, params] = useRoute("/plants/:id/logs/new");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plant, isLoading } = useGetPlant(id, {
    query: { enabled: !!id, queryKey: getGetPlantQueryKey(id) }
  });

  const createLog = useCreatePlantLog();

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      notes: "",
      photo: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(values: z.infer<typeof logSchema>) {
    createLog.mutate({ 
      id,
      data: {
        notes: values.notes,
        photo: values.photo || undefined,
        date: values.date ? new Date(values.date).toISOString() : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlantLogsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetActivityQueryKey() });
        toast({
          title: "Journal updated",
          description: "Your log entry has been saved.",
        });
        setLocation(`/plants/${id}`);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save journal entry.",
        });
      }
    });
  }

  if (isLoading) return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </Layout>
  );

  if (!plant) return (
    <Layout><div className="text-center py-20">Plant not found</div></Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/plants/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to {plant.name}
        </Link>
        
        <div>
          <h1 className="text-4xl font-serif tracking-tight font-medium text-foreground mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            New Journal Entry
          </h1>
          <p className="text-muted-foreground">Document new leaves, pest treatments, or general observations.</p>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background w-full sm:w-[200px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={`How is ${plant.name} doing today?`} 
                          className="min-h-[150px] bg-background resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex justify-end gap-4 border-t border-border">
                  <Button variant="outline" asChild type="button">
                    <Link href={`/plants/${id}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={createLog.isPending} className="px-8 rounded-full">
                    {createLog.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Entry
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
