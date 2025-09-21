import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Ticket, 
  AlertTriangle, 
  Settings, 
  ExternalLink,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  MoreHorizontal,
  Target,
  AlertCircle
} from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";

interface RelatedTicketsViewProps {
  ciId: string;
  ciName: string;
  tickets?: TicketType[];
  onTicketClick?: (ticket: TicketType) => void;
  onCreateTicket?: (type: string) => void;
  onBulkAction?: (action: string, ticketIds: string[]) => void;
}

interface SLAInfo {
  responseTimeHours: number;
  resolutionTimeHours: number;
  responseRemaining: number;
  resolutionRemaining: number;
  responseBreached: boolean;
  resolutionBreached: boolean;
}

type SortField = 'priority' | 'createdAt' | 'slaProgress' | 'status';
type SortDirection = 'asc' | 'desc';

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "incident":
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case "problem":
      return <Settings className="w-4 h-4 text-orange-600" />;
    case "change":
      return <Settings className="w-4 h-4 text-blue-600" />;
    default:
      return <Ticket className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    case "in progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "closed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

// SLA calculation helper
const calculateSLA = (ticket: TicketType): SLAInfo => {
  const now = new Date();
  const created = new Date(ticket.createdAt!);
  const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  // SLA thresholds based on priority
  const slaThresholds = {
    critical: { response: 1, resolution: 4 },
    high: { response: 2, resolution: 8 },
    medium: { response: 4, resolution: 24 },
    low: { response: 8, resolution: 72 }
  };

  const threshold = slaThresholds[ticket.priority?.toLowerCase() as keyof typeof slaThresholds] || slaThresholds.medium;
  
  return {
    responseTimeHours: threshold.response,
    resolutionTimeHours: threshold.resolution,
    responseRemaining: Math.max(0, threshold.response - hoursElapsed),
    resolutionRemaining: Math.max(0, threshold.resolution - hoursElapsed),
    responseBreached: hoursElapsed > threshold.response,
    resolutionBreached: hoursElapsed > threshold.resolution && !ticket.resolvedAt
  };
};

export default function RelatedTicketsView({ 
  ciId, 
  ciName,
  tickets = [],
  onTicketClick = (ticket) => console.log("Ticket clicked:", ticket.jiraKey),
  onCreateTicket = (type) => console.log("Create ticket:", type),
  onBulkAction = (action, ids) => console.log("Bulk action:", action, ids)
}: RelatedTicketsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showSLAOnly, setShowSLAOnly] = useState(false);

  // Enhanced mock tickets with SLA data
  const mockTickets: TicketType[] = tickets.length > 0 ? tickets : [
    {
      id: "1",
      jiraKey: "INC-2025-001",
      type: "Incident",
      title: `High CPU usage on ${ciName}`,
      description: "CPU utilization has exceeded 90% for the past 30 minutes",
      status: "In Progress",
      priority: "Critical",
      assignee: "john.doe@company.com",
      reporter: "monitoring@company.com",
      ciId: ciId,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date("2025-09-22T11:15:00Z"),
      resolvedAt: null
    },
    {
      id: "2",
      jiraKey: "PRB-2025-005",
      type: "Problem",
      title: `Recurring memory leaks on ${ciName}`,
      description: "Pattern of memory increases detected over past week",
      status: "Open",
      priority: "High",
      assignee: "jane.smith@company.com",
      reporter: "john.doe@company.com",
      ciId: ciId,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      updatedAt: new Date("2025-09-22T09:30:00Z"),
      resolvedAt: null
    },
    {
      id: "3",
      jiraKey: "CHG-2025-012",
      type: "Change",
      title: `OS patch deployment for ${ciName}`,
      description: "Scheduled security patch deployment",
      status: "Resolved",
      priority: "Medium",
      assignee: "patch.team@company.com",
      reporter: "security@company.com",
      ciId: ciId,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date("2025-09-19T16:45:00Z"),
      resolvedAt: new Date("2025-09-19T16:45:00Z")
    },
    {
      id: "4",
      jiraKey: "INC-2025-015",
      type: "Incident",
      title: `Database connection timeout on ${ciName}`,
      description: "Intermittent database connectivity issues",
      status: "Open",
      priority: "Medium",
      assignee: "db.admin@company.com",
      reporter: "app.team@company.com",
      ciId: ciId,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      updatedAt: new Date("2025-09-22T12:45:00Z"),
      resolvedAt: null
    }
  ];

  // Enhanced filtering and sorting
  const filteredAndSortedTickets = mockTickets
    .filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.jiraKey.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || ticket.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase();
      
      if (showSLAOnly) {
        const sla = calculateSLA(ticket);
        const hasSLAIssue = sla.responseBreached || sla.resolutionBreached;
        return matchesSearch && matchesType && matchesStatus && hasSLAIssue;
      }
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt!).getTime();
          bValue = new Date(b.createdAt!).getTime();
          break;
        case 'slaProgress':
          const aSLA = calculateSLA(a);
          const bSLA = calculateSLA(b);
          aValue = aSLA.resolutionRemaining;
          bValue = bSLA.resolutionRemaining;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredAndSortedTickets.map(t => t.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets(prev => [...prev, ticketId]);
    } else {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getTimeSinceCreated = (createdAt: Date) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "< 1h";
    if (diffInHours < 24) return `${diffInHours}h`;
    const days = Math.floor(diffInHours / 24);
    return `${days}d`;
  };

  const renderSLAIndicator = (ticket: TicketType) => {
    const sla = calculateSLA(ticket);
    const progress = Math.max(0, 100 - (sla.resolutionRemaining / sla.resolutionTimeHours * 100));
    
    let colorClass = "bg-green-500";
    let status = "On Track";
    
    if (sla.resolutionBreached) {
      colorClass = "bg-red-500";
      status = "Breached";
    } else if (progress > 75) {
      colorClass = "bg-yellow-500";
      status = "At Risk";
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${colorClass} transition-all duration-300`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <span className={`text-xs ${
                sla.resolutionBreached ? "text-red-600" : 
                progress > 75 ? "text-yellow-600" : "text-green-600"
              }`}>
                {status}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <div>Response SLA: {sla.responseTimeHours}h {sla.responseBreached ? "(Breached)" : ""}</div>
              <div>Resolution SLA: {sla.resolutionTimeHours}h</div>
              <div>Time Remaining: {sla.resolutionRemaining.toFixed(1)}h</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="w-full" data-testid="related-tickets-view">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Related Tickets for {ciName}
            <Badge variant="secondary">{filteredAndSortedTickets.length}</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCreateTicket("Incident")}
              data-testid="button-create-incident"
            >
              Create Incident
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCreateTicket("Problem")}
              data-testid="button-create-problem"
            >
              Create Problem
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCreateTicket("Change")}
              data-testid="button-create-change"
            >
              Create Change
            </Button>
          </div>
        </div>

        {/* Enhanced Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-input"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="change">Change</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showSLAOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSLAOnly(!showSLAOnly)}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              SLA Issues
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <div className="flex items-center gap-2 border rounded-md p-2">
              <span className="text-sm text-muted-foreground">
                {selectedTickets.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction("assign", selectedTickets)}
              >
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction("close", selectedTickets)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction("export", selectedTickets)}
              >
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('priority')}
            className="flex items-center gap-1"
          >
            Priority {getSortIcon('priority')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('createdAt')}
            className="flex items-center gap-1"
          >
            Created {getSortIcon('createdAt')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('slaProgress')}
            className="flex items-center gap-1"
          >
            SLA Progress {getSortIcon('slaProgress')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('status')}
            className="flex items-center gap-1"
          >
            Status {getSortIcon('status')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Select All Checkbox */}
        {filteredAndSortedTickets.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-md">
            <Checkbox
              checked={selectedTickets.length === filteredAndSortedTickets.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all visible tickets
            </span>
          </div>
        )}

        <div className="space-y-3" data-testid="tickets-list">
          {filteredAndSortedTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-tickets">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found matching your criteria</p>
              <p className="text-sm">Try adjusting your filters or create a new ticket</p>
            </div>
          ) : (
            filteredAndSortedTickets.map((ticket) => {
              const sla = calculateSLA(ticket);
              const isSelected = selectedTickets.includes(ticket.id);
              
              return (
                <Card
                  key={ticket.id}
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    isSelected ? "ring-2 ring-primary" : ""
                  } ${sla.resolutionBreached ? "border-red-300" : ""}`}
                  onClick={() => onTicketClick(ticket)}
                  data-testid={`ticket-${ticket.jiraKey}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />

                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(ticket.type)}
                            <span className="font-mono text-sm font-medium">{ticket.jiraKey}</span>
                            <Badge className={getPriorityColor(ticket.priority!)}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={getStatusColor(ticket.status!)}>
                              {ticket.status}
                            </Badge>
                            {sla.resolutionBreached && (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                SLA Breached
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-medium">{ticket.title}</h4>

                        {/* SLA Progress */}
                        {renderSLAIndicator(ticket)}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{ticket.assignee?.split('@')[0] || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(ticket.createdAt!)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeSinceCreated(ticket.createdAt!)}</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" data-testid={`button-view-ticket-${ticket.jiraKey}`}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Enhanced Summary Stats */}
        {filteredAndSortedTickets.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground" data-testid="ticket-stats">
                <span>Showing {filteredAndSortedTickets.length} of {mockTickets.length} tickets</span>
                <div className="flex items-center gap-4">
                  <span>{mockTickets.filter(t => t.status.toLowerCase() === 'open').length} Open</span>
                  <span>{mockTickets.filter(t => t.status.toLowerCase() === 'in progress').length} In Progress</span>
                  <span>{mockTickets.filter(t => t.priority.toLowerCase() === 'critical').length} Critical</span>
                </div>
              </div>

              {/* SLA Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {mockTickets.filter(t => calculateSLA(t).resolutionBreached).length}
                  </div>
                  <div className="text-xs text-muted-foreground">SLA Breached</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {mockTickets.filter(t => {
                      const sla = calculateSLA(t);
                      const progress = 100 - (sla.resolutionRemaining / sla.resolutionTimeHours * 100);
                      return progress > 75 && !sla.resolutionBreached;
                    }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">At Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {mockTickets.filter(t => {
                      const sla = calculateSLA(t);
                      const progress = 100 - (sla.resolutionRemaining / sla.resolutionTimeHours * 100);
                      return progress <= 75 && !sla.resolutionBreached;
                    }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">On Track</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}