import { useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import InitialLoadingScreen from "@/components/InitialLoadingScreen";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import AdminPanel from "@/pages/AdminPanel";
import About from "@/pages/About";
import AboutMe from "@/pages/AboutMe";
import TriggerConversation from "@/pages/TriggerConversation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/aboutme" component={AboutMe} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/trigger" component={TriggerConversation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isLoading ? (
          <InitialLoadingScreen onLoaded={handleLoadingComplete} />
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
