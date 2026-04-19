import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl, setCustomHeadersGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import UserDashboard from "@/pages/user-dashboard";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLicenses from "@/pages/admin/licenses";
import AdminScripts from "@/pages/admin/scripts";
import AdminLogs from "@/pages/admin/logs";
import AdminLuaLoader from "@/pages/admin/lua-loader";
import NotFound from "@/pages/not-found";

// Configure API base URL
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const baseUrl = isLocalhost ? "http://localhost:8080" : import.meta.env.VITE_API_URL || "/api";
setBaseUrl(baseUrl);

// Configure admin secret header
setCustomHeadersGetter(() => {
  const secret = sessionStorage.getItem("admin_secret");
  if (secret) {
    return { "x-admin-secret": secret };
  }
  return null;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/user" component={UserDashboard} />
      
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/licenses" component={AdminLicenses} />
      <Route path="/admin/scripts" component={AdminScripts} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/admin/lua-loader" component={AdminLuaLoader} />
      
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
