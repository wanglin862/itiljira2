import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  MapPin, 
  Monitor, 
  Database, 
  Network, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import type { ConfigurationItem } from "@shared/schema";

interface CIContextPanelProps {
  ci: ConfigurationItem;
  onViewTopology?: () => void;
  onViewRelatedTickets?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "maintenance":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case "inactive":
    case "decommissioned":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "server":
      return <Server className="w-5 h-5" />;
    case "vm":
      return <Monitor className="w-5 h-5" />;
    case "database":
      return <Database className="w-5 h-5" />;
    case "network":
      return <Network className="w-5 h-5" />;
    default:
      return <Server className="w-5 h-5" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "maintenance":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "inactive":
    case "decommissioned":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default function CIContextPanel({ 
  ci, 
  onViewTopology = () => console.log("View topology clicked"),
  onViewRelatedTickets = () => console.log("View related tickets clicked")
}: CIContextPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full" data-testid="ci-context-panel">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getTypeIcon(ci.type)}
            <div>
              <CardTitle className="text-lg" data-testid="ci-name">{ci.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getStatusColor(ci.status)} data-testid="ci-status">
                  {getStatusIcon(ci.status)}
                  <span className="ml-1">{ci.status}</span>
                </Badge>
                <Badge variant="secondary" data-testid="ci-type">{ci.type}</Badge>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-expand-ci"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4" data-testid="ci-basic-info">
          {ci.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Location:</span> {ci.location}
              </span>
            </div>
          )}
          {ci.environment && (
            <div className="text-sm">
              <span className="text-muted-foreground">Environment:</span> {ci.environment}
            </div>
          )}
          {ci.hostname && (
            <div className="text-sm">
              <span className="text-muted-foreground">Hostname:</span> {ci.hostname}
            </div>
          )}
          {ci.ipAddress && (
            <div className="text-sm">
              <span className="text-muted-foreground">IP Address:</span> {ci.ipAddress}
            </div>
          )}
        </div>

        {isExpanded && (
          <>
            <Separator />
            
            {/* Extended Information */}
            <div className="space-y-3" data-testid="ci-extended-info">
              {ci.operatingSystem && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Operating System:</span> {ci.operatingSystem}
                </div>
              )}
              {ci.businessService && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Business Service:</span> {ci.businessService}
                </div>
              )}
              {ci.owner && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Owner:</span> {ci.owner}
                </div>
              )}
              
              {/* Metadata */}
              {ci.metadata && typeof ci.metadata === 'object' && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Additional Info:</span>
                  <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                    {JSON.stringify(ci.metadata, null, 2) as string}
                  </div>
                </div>
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap" data-testid="ci-actions">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewTopology}
            data-testid="button-view-topology"
          >
            <Network className="w-4 h-4 mr-2" />
            View Topology
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewRelatedTickets}
            data-testid="button-view-related-tickets"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Related Tickets
          </Button>
        </div>

        {/* Quick Links */}
        <div className="text-xs text-muted-foreground">
          <span>Created: {new Date(ci.createdAt!).toLocaleDateString()}</span>
          {ci.updatedAt && (
            <span className="ml-4">Updated: {new Date(ci.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}