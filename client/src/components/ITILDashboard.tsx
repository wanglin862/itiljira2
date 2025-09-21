import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Server, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Users,
  Target,
  Calendar,
  Filter
} from "lucide-react";

interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
}

interface ITILDashboardProps {
  timeRange?: "24h" | "7d" | "30d";
  onTimeRangeChange?: (range: "24h" | "7d" | "30d") => void;
}

export default function ITILDashboard({ 
  timeRange = "24h",
  onTimeRangeChange = (range) => console.log("Time range changed:", range)
}: ITILDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // todo: remove mock functionality
  const metrics: DashboardMetric[] = [
    {
      label: "Active Incidents",
      value: 12,
      change: -15,
      trend: "down",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />
    },
    {
      label: "Open Problems",
      value: 5,
      change: 25,
      trend: "up", 
      icon: <Activity className="w-5 h-5 text-orange-600" />
    },
    {
      label: "Pending Changes",
      value: 8,
      change: 12,
      trend: "up",
      icon: <Calendar className="w-5 h-5 text-blue-600" />
    },
    {
      label: "SLA Compliance",
      value: "87%",
      change: 3,
      trend: "up",
      icon: <Target className="w-5 h-5 text-green-600" />
    },
    {
      label: "Avg Resolution Time",
      value: "4.2h",
      change: -8,
      trend: "down",
      icon: <Clock className="w-5 h-5 text-purple-600" />
    },
    {
      label: "Active CIs",
      value: 1247,
      change: 2,
      trend: "up",
      icon: <Server className="w-5 h-5 text-indigo-600" />
    }
  ];

  const recentActivity = [
    {
      id: "1",
      type: "incident",
      message: "INC-2025-001 escalated to L2 support",
      timestamp: "2 minutes ago",
      priority: "high"
    },
    {
      id: "2", 
      type: "change",
      message: "CHG-2025-015 approved for deployment",
      timestamp: "15 minutes ago",
      priority: "medium"
    },
    {
      id: "3",
      type: "problem",
      message: "PRB-2025-008 root cause identified",
      timestamp: "32 minutes ago", 
      priority: "medium"
    },
    {
      id: "4",
      type: "incident",
      message: "INC-2025-025 automatically resolved",
      timestamp: "1 hour ago",
      priority: "low"
    },
    {
      id: "5",
      type: "ci",
      message: "WEB-PROD-03 status changed to Maintenance",
      timestamp: "2 hours ago",
      priority: "medium"
    }
  ];

  const topAffectedCIs = [
    { name: "WEB-PROD-01", incidents: 8, status: "Active", location: "DC-East" },
    { name: "DB-PROD-02", incidents: 5, status: "Maintenance", location: "DC-West" },
    { name: "APP-PROD-05", incidents: 4, status: "Active", location: "DC-East" },
    { name: "LB-PROD-01", incidents: 3, status: "Active", location: "DC-Central" },
    { name: "STORAGE-01", incidents: 2, status: "Active", location: "DC-West" }
  ];

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "incident":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "problem":
        return <Activity className="w-4 h-4 text-orange-600" />;
      case "change":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "ci":
        return <Server className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-300";
    }
  };

  return (
    <div className="space-y-6" data-testid="itil-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ITIL Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your IT service operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={timeRange === "24h" ? "default" : "outline"} 
            size="sm"
            onClick={() => onTimeRangeChange("24h")}
            data-testid="button-timerange-24h"
          >
            24h
          </Button>
          <Button 
            variant={timeRange === "7d" ? "default" : "outline"} 
            size="sm"
            onClick={() => onTimeRangeChange("7d")}
            data-testid="button-timerange-7d"
          >
            7d
          </Button>
          <Button 
            variant={timeRange === "30d" ? "default" : "outline"} 
            size="sm"
            onClick={() => onTimeRangeChange("30d")}
            data-testid="button-timerange-30d"
          >
            30d
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="metrics-grid">
        {metrics.map((metric, index) => (
          <Card 
            key={index} 
            className={`hover-elevate cursor-pointer transition-all ${
              selectedMetric === metric.label ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedMetric(selectedMetric === metric.label ? null : metric.label)}
            data-testid={`metric-card-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(metric.trend)}
                    <span className={`${
                      metric.trend === "up" 
                        ? metric.change > 0 ? "text-green-600" : "text-red-600"
                        : metric.trend === "down"
                        ? metric.change > 0 ? "text-red-600" : "text-green-600"
                        : "text-muted-foreground"
                    }`}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card data-testid="recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className={`p-3 border-l-4 bg-muted/50 rounded-r-lg ${getPriorityColor(activity.priority)}`}
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-activity">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Top Affected CIs */}
        <Card data-testid="top-affected-cis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Most Affected CIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAffectedCIs.map((ci, index) => (
                <div 
                  key={ci.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate cursor-pointer"
                  data-testid={`affected-ci-${ci.name}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{ci.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{ci.location}</span>
                        <Badge 
                          variant="outline" 
                          className={ci.status === "Active" ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"}
                        >
                          {ci.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{ci.incidents}</p>
                    <p className="text-xs text-muted-foreground">incidents</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-cis">
              View All CIs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card data-testid="insights">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">Active Technicians</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">92%</p>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}