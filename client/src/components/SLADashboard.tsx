import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Target,
  Timer,
  Calendar,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import type { SLAMetric, Ticket } from "@shared/schema";

interface SLADashboardProps {
  metrics?: SLAMetric[];
  tickets?: Ticket[];
  onEscalateTicket?: (ticketId: string) => void;
}

interface SLAStatus {
  id: string;
  ticketKey: string;
  ticketTitle: string;
  type: string;
  priority: string;
  targetTime: number; // hours
  elapsedTime: number; // hours
  remainingTime: number; // hours
  status: "on-track" | "at-risk" | "breached";
  escalationLevel: string;
  assignee: string;
}

export default function SLADashboard({ 
  metrics = [],
  tickets = [],
  onEscalateTicket = (ticketId) => console.log("Escalate ticket:", ticketId)
}: SLADashboardProps) {
  const [timeFrame, setTimeFrame] = useState<"24h" | "7d" | "30d">("24h");

  // todo: remove mock functionality
  const mockSLAData: SLAStatus[] = [
    {
      id: "1",
      ticketKey: "INC-2025-001",
      ticketTitle: "High CPU usage on WEB-PROD-01",
      type: "Incident",
      priority: "High",
      targetTime: 4,
      elapsedTime: 3.5,
      remainingTime: 0.5,
      status: "at-risk",
      escalationLevel: "L1",
      assignee: "john.doe"
    },
    {
      id: "2",
      ticketKey: "PRB-2025-005",
      ticketTitle: "Recurring memory leaks",
      type: "Problem",
      priority: "Medium",
      targetTime: 24,
      elapsedTime: 18,
      remainingTime: 6,
      status: "on-track",
      escalationLevel: "L2",
      assignee: "jane.smith"
    },
    {
      id: "3",
      ticketKey: "INC-2025-015",
      ticketTitle: "Service unavailable",
      type: "Incident",
      priority: "Critical",
      targetTime: 1,
      elapsedTime: 2.5,
      remainingTime: -1.5,
      status: "breached",
      escalationLevel: "L3",
      assignee: "oncall"
    },
    {
      id: "4",
      ticketKey: "CHG-2025-012",
      ticketTitle: "OS patch deployment",
      type: "Change",
      priority: "Medium",
      targetTime: 72,
      elapsedTime: 24,
      remainingTime: 48,
      status: "on-track",
      escalationLevel: "L1",
      assignee: "patch.team"
    }
  ];

  const getStatusColor = (status: SLAStatus["status"]) => {
    switch (status) {
      case "on-track":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "at-risk":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "breached":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: SLAStatus["status"]) => {
    switch (status) {
      case "on-track":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "at-risk":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "breached":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateProgress = (elapsed: number, target: number) => {
    return Math.min((elapsed / target) * 100, 100);
  };

  const formatTime = (hours: number) => {
    if (Math.abs(hours) < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${Math.round(hours * 10) / 10}h`;
  };

  const breachedCount = mockSLAData.filter(item => item.status === "breached").length;
  const atRiskCount = mockSLAData.filter(item => item.status === "at-risk").length;
  const onTrackCount = mockSLAData.filter(item => item.status === "on-track").length;

  return (
    <Card className="w-full" data-testid="sla-dashboard">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            SLA Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant={timeFrame === "24h" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeFrame("24h")}
              data-testid="button-timeframe-24h"
            >
              24h
            </Button>
            <Button 
              variant={timeFrame === "7d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeFrame("7d")}
              data-testid="button-timeframe-7d"
            >
              7d
            </Button>
            <Button 
              variant={timeFrame === "30d" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeFrame("30d")}
              data-testid="button-timeframe-30d"
            >
              30d
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="sla-summary">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Breached</p>
                  <p className="text-2xl font-bold text-red-700">{breachedCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">At Risk</p>
                  <p className="text-2xl font-bold text-yellow-700">{atRiskCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">On Track</p>
                  <p className="text-2xl font-bold text-green-700">{onTrackCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Active</p>
                  <p className="text-2xl font-bold">{mockSLAData.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Active SLA Items */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active SLA Tracking</h3>
          
          {mockSLAData.map((item) => (
            <Card 
              key={item.id} 
              className={`hover-elevate transition-all ${
                item.status === "breached" ? "border-red-200 dark:border-red-800" :
                item.status === "at-risk" ? "border-yellow-200 dark:border-yellow-800" : ""
              }`}
              data-testid={`sla-item-${item.ticketKey}`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-primary">{item.ticketKey}</span>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1 capitalize">{item.status.replace('-', ' ')}</span>
                        </Badge>
                        <Badge variant="secondary">{item.priority}</Badge>
                        <Badge variant="outline">{item.escalationLevel}</Badge>
                      </div>
                      <h4 className="font-medium">{item.ticketTitle}</h4>
                    </div>
                    {item.status === "breached" || item.status === "at-risk" ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEscalateTicket(item.id)}
                        data-testid={`button-escalate-${item.ticketKey}`}
                      >
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Escalate
                      </Button>
                    ) : null}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Progress: {formatTime(item.elapsedTime)} / {formatTime(item.targetTime)}
                      </span>
                      <span className={`font-medium ${
                        item.remainingTime < 0 ? "text-red-600" :
                        item.remainingTime < item.targetTime * 0.2 ? "text-yellow-600" :
                        "text-green-600"
                      }`}>
                        {item.remainingTime < 0 ? "Overdue by " : ""}
                        {formatTime(Math.abs(item.remainingTime))}
                        {item.remainingTime >= 0 ? " remaining" : ""}
                      </span>
                    </div>
                    <Progress 
                      value={calculateProgress(item.elapsedTime, item.targetTime)}
                      className={`h-2 ${
                        item.status === "breached" ? "bg-red-100" :
                        item.status === "at-risk" ? "bg-yellow-100" : 
                        "bg-green-100"
                      }`}
                      data-testid={`progress-${item.ticketKey}`}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>Target: {formatTime(item.targetTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Assignee: {item.assignee}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SLA Metrics Summary */}
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" data-testid="sla-metrics">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Average Resolution Time</span>
            <span className="font-medium">4.2h</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">SLA Compliance Rate</span>
            <span className="font-medium text-green-600">87%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Escalations Today</span>
            <span className="font-medium text-orange-600">3</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}