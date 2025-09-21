import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Ticket, 
  AlertTriangle, 
  Settings, 
  ExternalLink,
  Search,
  Filter,
  Clock,
  User,
  Calendar
} from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";

interface RelatedTicketsViewProps {
  ciId: string;
  ciName: string;
  tickets?: TicketType[];
  onTicketClick?: (ticket: TicketType) => void;
  onCreateTicket?: (type: string) => void;
}

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
    case "cancelled":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default function RelatedTicketsView({ 
  ciId, 
  ciName,
  tickets = [],
  onTicketClick = (ticket) => console.log("Ticket clicked:", ticket.jiraKey),
  onCreateTicket = (type) => console.log("Create ticket:", type)
}: RelatedTicketsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // todo: remove mock functionality
  const mockTickets: TicketType[] = tickets.length > 0 ? tickets : [
    {
      id: "1",
      jiraKey: "INC-2025-001",
      type: "Incident",
      title: `High CPU usage on ${ciName}`,
      description: "CPU utilization has exceeded 90% for the past 30 minutes",
      status: "In Progress",
      priority: "High",
      assignee: "john.doe@company.com",
      reporter: "monitoring@company.com",
      ciId: ciId,
      createdAt: new Date("2025-09-22T10:30:00Z"),
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
      priority: "Medium",
      assignee: "jane.smith@company.com",
      reporter: "john.doe@company.com",
      ciId: ciId,
      createdAt: new Date("2025-09-20T14:20:00Z"),
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
      createdAt: new Date("2025-09-18T09:00:00Z"),
      updatedAt: new Date("2025-09-19T16:45:00Z"),
      resolvedAt: new Date("2025-09-19T16:45:00Z")
    },
    {
      id: "4",
      jiraKey: "INC-2025-015",
      type: "Incident",
      title: `Service unavailable on ${ciName}`,
      description: "Application service is not responding",
      status: "Closed",
      priority: "Critical",
      assignee: "oncall@company.com",
      reporter: "user@company.com",
      ciId: ciId,
      createdAt: new Date("2025-09-15T16:20:00Z"),
      updatedAt: new Date("2025-09-16T08:30:00Z"),
      resolvedAt: new Date("2025-09-16T08:30:00Z")
    }
  ];

  // Filter tickets
  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.jiraKey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || ticket.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const getTimeSinceCreated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "< 1h ago";
  };

  return (
    <Card className="w-full" data-testid="related-tickets-view">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Related Tickets for {ciName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCreateTicket("Incident")}
              data-testid="button-create-incident"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              New Incident
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCreateTicket("Problem")}
              data-testid="button-create-problem"
            >
              <Settings className="w-4 h-4 mr-2" />
              New Problem
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex gap-4 items-center" data-testid="ticket-filters">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-tickets"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32" data-testid="select-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="incident">Incident</SelectItem>
              <SelectItem value="problem">Problem</SelectItem>
              <SelectItem value="change">Change</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Tickets List */}
        <div className="space-y-3" data-testid="tickets-list">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => onTicketClick(ticket)}
                data-testid={`ticket-card-${ticket.jiraKey}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        {getTypeIcon(ticket.type)}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-primary" data-testid={`ticket-key-${ticket.jiraKey}`}>
                            {ticket.jiraKey}
                          </span>
                          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <div>
                        <h4 className="font-medium" data-testid={`ticket-title-${ticket.jiraKey}`}>
                          {ticket.title}
                        </h4>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {ticket.description}
                          </p>
                        )}
                      </div>

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
            ))
          )}
        </div>

        {/* Summary Stats */}
        {filteredTickets.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground" data-testid="ticket-stats">
              <span>Showing {filteredTickets.length} of {mockTickets.length} tickets</span>
              <div className="flex items-center gap-4">
                <span>{mockTickets.filter(t => t.status.toLowerCase() === 'open').length} Open</span>
                <span>{mockTickets.filter(t => t.status.toLowerCase() === 'in progress').length} In Progress</span>
                <span>{mockTickets.filter(t => t.priority.toLowerCase() === 'critical').length} Critical</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}