import { Layout } from "@/components/layout";
import { useCreatePlant, getListPlantsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
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
import { ArrowLeft, Loader2, Leaf } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

const plantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  species: z.string().min(1, "Species is required"),
  photo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  dateAcquired: z.string().min(1, "Date acquired is required"),
  wateringFrequencyDays: z.coerce.number().min(1, "Must be at least 1 day"),
});

export default function PlantNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPlant = useCreatePlant();

  const form = useForm<z.infer<typeof plantSchema>>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: "",
      species: "",
      photo: "",
      dateAcquired: new Date().toISOString().split('T')[0],
      wateringFrequencyDays: 7,
    },
  });

  function onSubmit(values: z.infer<typeof plantSchema>) {
    createPlant.mutate({ 
      data: {
        ...values,
        photo: values.photo || undefined,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: "Plant added",
          description: "Your new plant has been added to the garden.",
        });
        setLocation(`/plants/${data.id}`);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add plant. Please try again.",
        });
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Garden
        </Link>
        
        <div>
          <h1 className="text-4xl font-serif tracking-tight font-medium text-foreground mb-2 flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            Add New Plant
          </h1>
          <p className="text-muted-foreground">
            Enter the details of your new green friend to start tracking its care.
          </p>
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
                          <Input placeholder="e.g. Barnaby" {...field} className="bg-background" />
                        </FormControl>
                        <FormDescription>What do you call this plant?</FormDescription>
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
                          <Input placeholder="e.g. Monstera Deliciosa" {...field} className="bg-background" />
                        </FormControl>
                        <FormDescription>The scientific or common name.</FormDescription>
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
                      <FormLabel>Photo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} className="bg-background" />
                      </FormControl>
                      <FormDescription>A link to an image of your plant.</FormDescription>
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
                        <FormDescription>How often does it need water?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border">
                  <Button variant="outline" asChild type="button">
                    <Link href="/">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={createPlant.isPending} className="px-8 rounded-full">
                    {createPlant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Plant
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
