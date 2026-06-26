import { Layout } from "@/components/layout";
import { useGetPlant, useUpdatePlant, getGetPlantQueryKey, getListPlantsQueryKey } from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Edit3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const plantUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  species: z.string().min(1, "Species is required"),
  photo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  dateAcquired: z.string().min(1, "Date acquired is required"),
  wateringFrequencyDays: z.coerce.number().min(1, "Must be at least 1 day"),
});

export default function PlantEdit() {
  const [, params] = useRoute("/plants/:id/edit");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plant, isLoading } = useGetPlant(id, {
    query: { enabled: !!id, queryKey: getGetPlantQueryKey(id) }
  });

  const updatePlant = useUpdatePlant();

  const form = useForm<z.infer<typeof plantUpdateSchema>>({
    resolver: zodResolver(plantUpdateSchema),
    defaultValues: {
      name: "",
      species: "",
      photo: "",
      dateAcquired: "",
      wateringFrequencyDays: 7,
    },
  });

  useEffect(() => {
    if (plant) {
      form.reset({
        name: plant.name,
        species: plant.species,
        photo: plant.photo || "",
        dateAcquired: plant.dateAcquired.split('T')[0],
        wateringFrequencyDays: plant.wateringFrequencyDays,
      });
    }
  }, [plant, form]);

  function onSubmit(values: z.infer<typeof plantUpdateSchema>) {
    updatePlant.mutate({ 
      id,
      data: {
        ...values,
        photo: values.photo || undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlantQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        toast({
          title: "Plant updated",
          description: "Changes saved successfully.",
        });
        setLocation(`/plants/${id}`);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update plant.",
        });
      }
    });
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif">Plant not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/plants/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to {plant.name}
        </Link>
        
        <div>
          <h1 className="text-4xl font-serif tracking-tight font-medium text-foreground mb-2 flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-primary" />
            Edit Plant Profile
          </h1>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="species"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Species / Variety</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dateAcquired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Acquired</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wateringFrequencyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Watering Frequency (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border">
                  <Button variant="outline" asChild type="button">
                    <Link href={`/plants/${id}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={updatePlant.isPending} className="px-8 rounded-full">
                    {updatePlant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
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
