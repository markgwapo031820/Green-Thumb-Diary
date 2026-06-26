import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PlantNew from "@/pages/plant-new";
import PlantDetail from "@/pages/plant-detail";
import PlantEdit from "@/pages/plant-edit";
import PlantLogNew from "@/pages/plant-log-new";
import Stats from "@/pages/stats";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/stats" component={Stats} />
      <Route path="/plants/new" component={PlantNew} />
      <Route path="/plants/:id" component={PlantDetail} />
      <Route path="/plants/:id/edit" component={PlantEdit} />
      <Route path="/plants/:id/logs/new" component={PlantLogNew} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;