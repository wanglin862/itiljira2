import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import ITILDashboard from "@/components/ITILDashboard";
import ITILReports from "@/components/ITILReports";
import CIContextPanel from "@/components/CIContextPanel";
import CITopologyMap from "@/components/CITopologyMap";
import RelatedTicketsView from "@/components/RelatedTicketsView";
import SLADashboard from "@/components/SLADashboard";
import ITILAutomation from "@/components/ITILAutomation";
import MonitoringIntegration from "@/components/MonitoringIntegration";
import IncidentManagement from "@/components/IncidentManagement";
import ChangeManagement from "@/components/ChangeManagement";
import JiraIntegration from "@/components/JiraIntegration";
import NotFound from "@/pages/not-found";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { ConfigurationItem } from "@shared/schema";

// Mock CI data for demonstration
const mockCI: ConfigurationItem = {
  id: "1",
  name: "WEB-PROD-01",
  type: "Server",
  status: "Active",
  location: "DC-East-Rack-A12",
  ipAddress: "192.168.1.100",
  hostname: "web-prod-01.company.com",
  operatingSystem: "Ubuntu 20.04 LTS",
  environment: "Production",
  businessService: "E-commerce Platform",
  owner: "DevOps Team",
  metadata: {
    rack: "A12",
    powerDrawWatts: 450,
    cpuCores: 16,
    ramGB: 64,
    diskGB: 500
  },
  createdAt: new Date("2025-09-15T10:30:00Z"),
  updatedAt: new Date("2025-09-22T14:20:00Z")
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ITILDashboard />} />
      <Route path="/cis" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Configuration Items</h1>
          <CIContextPanel ci={mockCI} />
        </div>
      } />
      <Route path="/topology" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">CI Topology Map</h1>
          <CITopologyMap centralCI={mockCI} />
        </div>
      } />
      <Route path="/tickets" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <RelatedTicketsView ciId={mockCI.id} ciName={mockCI.name} />
        </div>
      } />
      <Route path="/sla" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">SLA Management</h1>
          <SLADashboard />
        </div>
      } />
      <Route path="/incidents" component={() => <IncidentManagement />} />
      <Route path="/problems" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Problem Management</h1>
          <RelatedTicketsView ciId={mockCI.id} ciName="All Systems" />
        </div>
      } />
      <Route path="/changes" component={() => <ChangeManagement />} />
      <Route path="/analytics" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <ITILReports />
        </div>
      } />
      <Route path="/team" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Team Performance</h1>
          <SLADashboard />
        </div>
      } />
      <Route path="/automation" component={() => <ITILAutomation />} />
      <Route path="/monitoring" component={() => <MonitoringIntegration />} />
      <Route path="/jira" component={() => <JiraIntegration />} />
      <Route path="/settings" component={() => 
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CIContextPanel ci={mockCI} />
            <SLADashboard />
          </div>
        </div>
      } />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Custom sidebar width for ITIL management application
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <div>
                        <h1 className="text-lg font-semibold">JIRA ITIL Management</h1>
                        <p className="text-xs text-muted-foreground">Integrated IT Service Management</p>
                      </div>
                    </div>
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto p-6">
                    <ErrorBoundary>
                      <Router />
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
