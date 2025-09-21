import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Server, 
  Monitor, 
  Database, 
  Network,
  Cloud,
  HardDrive,
  Wifi,
  Shield,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Info,
  Search,
  Filter,
  RotateCcw,
  Move,
  Eye,
  EyeOff,
  GitBranch,
  Layers,
  Target,
  Activity
} from "lucide-react";
import type { ConfigurationItem, CIRelationship } from "@shared/schema";

interface CITopologyMapProps {
  centralCI: ConfigurationItem;
  relatedCIs?: ConfigurationItem[];
  relationships?: CIRelationship[];
  onCIClick?: (ci: ConfigurationItem) => void;
}

interface TopologyNode {
  id: string;
  ci: ConfigurationItem;
  x: number;
  y: number;
  level: number;
  isDragging?: boolean;
  visible?: boolean;
}

interface TopologyLink {
  source: string;
  target: string;
  type: string;
  strength?: number;
}

type LayoutType = 'circular' | 'hierarchical' | 'force' | 'grid';
type ViewMode = 'full' | 'summary' | 'minimal';

const getTypeIcon = (type: string, size = "w-6 h-6") => {
  const iconClass = `${size}`;
  switch (type.toLowerCase()) {
    case "server":
      return <Server className={`${iconClass} text-blue-600`} />;
    case "vm":
      return <Monitor className={`${iconClass} text-purple-600`} />;
    case "database":
      return <Database className={`${iconClass} text-green-600`} />;
    case "network":
      return <Network className={`${iconClass} text-orange-600`} />;
    case "storage":
      return <HardDrive className={`${iconClass} text-cyan-600`} />;
    case "application":
      return <Cloud className={`${iconClass} text-indigo-600`} />;
    case "service":
      return <Activity className={`${iconClass} text-pink-600`} />;
    case "security":
      return <Shield className={`${iconClass} text-red-600`} />;
    case "loadbalancer":
      return <GitBranch className={`${iconClass} text-yellow-600`} />;
    default:
      return <Server className={`${iconClass} text-gray-600`} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
    case "operational":
      return "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-100";
    case "maintenance":
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-yellow-100";
    case "degraded":
      return "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-orange-100";
    case "inactive":
    case "down":
    case "decommissioned":
      return "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-red-100";
    default:
      return "border-gray-300 bg-gray-50 dark:bg-gray-900/20 shadow-gray-100";
  }
};

const getRelationshipColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "depends_on":
      return "#ef4444"; // red
    case "connects_to":
      return "#3b82f6"; // blue
    case "hosted_on":
      return "#10b981"; // green
    case "part_of":
      return "#8b5cf6"; // purple
    case "manages":
      return "#f59e0b"; // amber
    default:
      return "#6b7280"; // gray
  }
};

export default function CITopologyMap({ 
  centralCI, 
  relatedCIs = [], 
  relationships = [],
  onCIClick = (ci) => console.log("CI clicked:", ci.name)
}: CITopologyMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [layoutType, setLayoutType] = useState<LayoutType>('circular');
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [impactAnalysisMode, setImpactAnalysisMode] = useState(false);
  const [highlightedPaths, setHighlightedPaths] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Enhanced mock data với nhiều CI types
  const mockRelatedCIs: ConfigurationItem[] = relatedCIs.length > 0 ? relatedCIs : [
    {
      id: "2",
      name: "DB-PROD-01",
      type: "Database", 
      status: "Active",
      location: "DC-East",
      hostname: "db-prod-01.company.com",
      ipAddress: "192.168.1.10",
      environment: "Production",
      businessService: "E-commerce Platform",
      owner: "DBA Team",
      operatingSystem: "PostgreSQL 14",
      metadata: null,
      createdAt: new Date("2025-09-15"),
      updatedAt: new Date("2025-09-20")
    },
    {
      id: "3", 
      name: "LB-PROD-01",
      type: "LoadBalancer",
      status: "Active", 
      location: "DC-East",
      hostname: "lb-prod-01.company.com",
      ipAddress: "192.168.1.5",
      environment: "Production",
      businessService: "Load Balancing",
      owner: "Network Team",
      operatingSystem: "F5 TMOS",
      metadata: null,
      createdAt: new Date("2025-09-10"),
      updatedAt: new Date("2025-09-18")
    },
    {
      id: "4",
      name: "STORAGE-01", 
      type: "Storage",
      status: "Maintenance",
      location: "DC-East",
      hostname: "storage-01.company.com", 
      ipAddress: "192.168.1.20",
      environment: "Production",
      businessService: "Data Storage",
      owner: "Storage Team",
      operatingSystem: "NetApp ONTAP",
      metadata: null,
      createdAt: new Date("2025-09-05"),
      updatedAt: new Date("2025-09-22")
    },
    {
      id: "5",
      name: "FIREWALL-01",
      type: "Security",
      status: "Active",
      location: "DC-East",
      hostname: "fw-01.company.com",
      ipAddress: "192.168.1.1",
      environment: "Production",
      businessService: "Network Security",
      owner: "Security Team",
      operatingSystem: "Fortinet FortiOS",
      metadata: null,
      createdAt: new Date("2025-09-01"),
      updatedAt: new Date("2025-09-20")
    },
    {
      id: "6",
      name: "API-SERVICE",
      type: "Service",
      status: "Degraded",
      location: "Cloud-AWS",
      hostname: "api.company.com",
      ipAddress: "10.0.1.50",
      environment: "Production",
      businessService: "API Gateway",
      owner: "DevOps Team",
      operatingSystem: "Docker Container",
      metadata: null,
      createdAt: new Date("2025-09-12"),
      updatedAt: new Date("2025-09-22")
    }
  ];

  // Get all unique CI types for filtering
  const allCITypes = [...new Set([centralCI, ...mockRelatedCIs].map(ci => ci.type))];

  // Filter CIs based on search and type filters
  const filteredCIs = mockRelatedCIs.filter(ci => {
    const matchesSearch = ci.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ci.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filteredTypes.length === 0 || filteredTypes.includes(ci.type);
    return matchesSearch && matchesType;
  });

  // Impact Analysis Functions
  const analyzeImpact = useCallback((nodeId: string): string[] => {
    const impactedNodes: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (currentId: string, depth: number = 0) => {
      if (visited.has(currentId) || depth > 3) return; // Prevent infinite loops and limit depth
      
      visited.add(currentId);
      impactedNodes.push(currentId);
      
      // Find all nodes that depend on current node
      links.forEach(link => {
        if (link.source === currentId && link.type === 'depends_on') {
          traverse(link.target, depth + 1);
        }
        if (link.target === currentId && link.type === 'hosted_on') {
          traverse(link.source, depth + 1);
        }
      });
    };
    
    traverse(nodeId);
    return impactedNodes;
  }, [links]);

  const toggleImpactAnalysis = () => {
    if (impactAnalysisMode) {
      setImpactAnalysisMode(false);
      setHighlightedPaths([]);
    } else {
      setImpactAnalysisMode(true);
      if (selectedNode) {
        const impactedNodes = analyzeImpact(selectedNode);
        setHighlightedPaths(impactedNodes);
      }
    }
  };

  // Update impact analysis when selected node changes
  useEffect(() => {
    if (impactAnalysisMode && selectedNode) {
      const impactedNodes = analyzeImpact(selectedNode);
      setHighlightedPaths(impactedNodes);
    }
  }, [selectedNode, impactAnalysisMode, analyzeImpact]);

  // Enhanced layout algorithms
  const calculateLayout = useCallback((): { nodes: TopologyNode[], links: TopologyLink[] } => {
    const allCIs = [centralCI, ...filteredCIs];
    const containerWidth = 600;
    const containerHeight = 400;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    let nodes: TopologyNode[] = [];

    switch (layoutType) {
      case 'circular':
        nodes = allCIs.map((ci, index) => {
          if (index === 0) {
            return { id: ci.id, ci, x: centerX, y: centerY, level: 0, visible: true };
          } else {
            const radius = 150;
            const angle = (2 * Math.PI * (index - 1)) / (allCIs.length - 1);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            return { id: ci.id, ci, x, y, level: 1, visible: true };
          }
        });
        break;

      case 'hierarchical':
        nodes = allCIs.map((ci, index) => {
          if (index === 0) {
            return { id: ci.id, ci, x: centerX, y: 80, level: 0, visible: true };
          } else {
            const itemsPerRow = Math.ceil(Math.sqrt(allCIs.length - 1));
            const row = Math.floor((index - 1) / itemsPerRow);
            const col = (index - 1) % itemsPerRow;
            const x = 100 + col * 120;
            const y = 200 + row * 100;
            return { id: ci.id, ci, x, y, level: row + 1, visible: true };
          }
        });
        break;

      case 'grid':
        nodes = allCIs.map((ci, index) => {
          const itemsPerRow = Math.ceil(Math.sqrt(allCIs.length));
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const x = 80 + col * 140;
          const y = 80 + row * 120;
          return { id: ci.id, ci, x, y, level: row, visible: true };
        });
        break;

      case 'force':
        // Simplified force-directed layout
        nodes = allCIs.map((ci, index) => {
          if (index === 0) {
            return { id: ci.id, ci, x: centerX, y: centerY, level: 0, visible: true };
          } else {
            const radius = 100 + Math.random() * 100;
            const angle = Math.random() * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            return { id: ci.id, ci, x, y, level: 1, visible: true };
          }
        });
        break;
    }

    // Enhanced mock relationships
    const links: TopologyLink[] = [
      { source: centralCI.id, target: "2", type: "depends_on", strength: 0.8 },
      { source: centralCI.id, target: "3", type: "connects_to", strength: 0.6 },
      { source: centralCI.id, target: "4", type: "hosted_on", strength: 0.9 },
      { source: centralCI.id, target: "5", type: "part_of", strength: 0.7 },
      { source: centralCI.id, target: "6", type: "manages", strength: 0.5 },
      { source: "2", target: "4", type: "hosted_on", strength: 0.8 },
      { source: "3", target: "5", type: "connects_to", strength: 0.6 }
    ];

    return { nodes, links };
  }, [centralCI, filteredCIs, layoutType]);

  const { nodes, links } = calculateLayout();

  // Zoom and pan functions
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.3));
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Node size based on view mode
  const getNodeSize = () => {
    switch (viewMode) {
      case 'minimal': return 'w-4 h-4';
      case 'summary': return 'w-5 h-5';
      case 'full': return 'w-6 h-6';
      default: return 'w-6 h-6';
    }
  };

  // Enhanced node component
  const renderNode = (node: TopologyNode) => {
    const isSelected = selectedNode === node.id;
    const isDragging = draggedNode === node.id;
    const isHighlighted = impactAnalysisMode && highlightedPaths.includes(node.id);
    const isImpactSource = impactAnalysisMode && selectedNode === node.id;
    
    return (
      <TooltipProvider key={node.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                isSelected ? "ring-4 ring-primary ring-opacity-50" : ""
              } ${isDragging ? "scale-110 shadow-2xl" : ""} ${
                isImpactSource ? "ring-4 ring-red-500 ring-opacity-75" : 
                isHighlighted ? "ring-2 ring-orange-500 ring-opacity-50" : ""
              } ${
                getStatusColor(node.ci.status)
              } border-2 rounded-xl p-3 min-w-[100px] backdrop-blur-sm hover:shadow-lg ${
                impactAnalysisMode && !isHighlighted ? "opacity-50" : ""
              } ${isHighlighted ? "animate-pulse" : ""}`}
              style={{
                left: `${(node.x + panOffset.x) * zoomLevel}px`,
                top: `${(node.y + panOffset.y) * zoomLevel}px`,
                transform: `translate(-50%, -50%) scale(${zoomLevel})`
              }}
              onClick={() => {
                setSelectedNode(node.id);
                onCIClick(node.ci);
              }}
              data-testid={`topology-node-${node.ci.name}`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {getTypeIcon(node.ci.type, getNodeSize())}
                  {node.ci.status !== "Active" && node.ci.status !== "Operational" && (
                    <div className="absolute -top-1 -right-1">
                      <div className={`w-3 h-3 rounded-full ${
                        node.ci.status === "Maintenance" ? "bg-yellow-500" :
                        node.ci.status === "Degraded" ? "bg-orange-500" : "bg-red-500"
                      } animate-pulse`} />
                    </div>
                  )}
                </div>
                
                {showLabels && viewMode !== 'minimal' && (
                  <div className="text-center">
                    <div className="font-medium text-xs truncate max-w-[80px]">
                      {node.ci.name}
                    </div>
                    {viewMode === 'full' && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {node.ci.status}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-semibold">{node.ci.name}</div>
              <div className="text-xs space-y-1">
                <div>Type: {node.ci.type}</div>
                <div>Status: <span className={
                  node.ci.status === "Active" ? "text-green-600" :
                  node.ci.status === "Maintenance" ? "text-yellow-600" :
                  node.ci.status === "Degraded" ? "text-orange-600" : "text-red-600"
                }>{node.ci.status}</span></div>
                <div>Location: {node.ci.location}</div>
                {node.ci.ipAddress && <div>IP: {node.ci.ipAddress}</div>}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="w-full" data-testid="ci-topology-map">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            CI Topology Map
            <Badge variant="secondary" className="ml-2">
              {nodes.length} CIs
            </Badge>
          </CardTitle>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search CIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-40"
              />
            </div>

            {/* Layout Type */}
            <Select value={layoutType} onValueChange={(value: LayoutType) => setLayoutType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="hierarchical">Tree</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="force">Force</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle Labels */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              className="p-2"
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            {/* Impact Analysis Toggle */}
            <Button
              variant={impactAnalysisMode ? "default" : "outline"}
              size="sm"
              onClick={toggleImpactAnalysis}
              className="p-2"
              disabled={!selectedNode}
            >
              <Target className="w-4 h-4" />
            </Button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-md">
              <Button variant="ghost" size="sm" onClick={zoomOut} className="p-2">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button variant="ghost" size="sm" onClick={zoomIn} className="p-2">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Reset View */}
            <Button variant="outline" size="sm" onClick={resetView} className="p-2">
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Details Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="p-2"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {allCITypes.map(type => (
            <Button
              key={type}
              variant={filteredTypes.includes(type) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilteredTypes(prev => 
                  prev.includes(type) 
                    ? prev.filter(t => t !== type)
                    : [...prev, type]
                );
              }}
              className="text-xs"
            >
              {getTypeIcon(type, "w-3 h-3")}
              <span className="ml-1">{type}</span>
            </Button>
          ))}
          {filteredTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilteredTypes([])}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div 
          ref={containerRef}
          className="relative overflow-hidden border rounded-lg bg-gradient-to-br from-background to-muted/20" 
          style={{ minHeight: "500px", height: "500px" }}
        >
          {/* SVG for connections */}
          <svg 
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none" 
            data-testid="topology-svg"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="currentColor"
                />
              </marker>
            </defs>
            
            {links.map((link, index) => {
              const sourceNode = nodes.find(n => n.id === link.source);
              const targetNode = nodes.find(n => n.id === link.target);
              
              if (!sourceNode || !targetNode) return null;
              
              const color = getRelationshipColor(link.type);
              const strokeWidth = (link.strength || 0.5) * 4 + 1;
              
              // Check if this link should be highlighted for impact analysis
              const isHighlighted = impactAnalysisMode && 
                (highlightedPaths.includes(link.source) && highlightedPaths.includes(link.target));
              
              return (
                <g key={index}>
                  <line
                    x1={(sourceNode.x + panOffset.x) * zoomLevel}
                    y1={(sourceNode.y + panOffset.y) * zoomLevel}
                    x2={(targetNode.x + panOffset.x) * zoomLevel}
                    y2={(targetNode.y + panOffset.y) * zoomLevel}
                    stroke={isHighlighted ? "#ef4444" : color}
                    strokeWidth={isHighlighted ? strokeWidth + 2 : strokeWidth}
                    strokeDasharray={link.type === "depends_on" ? "8,4" : "none"}
                    markerEnd="url(#arrowhead)"
                    opacity={isHighlighted ? 1 : (impactAnalysisMode ? 0.3 : 0.7)}
                    className={isHighlighted ? "animate-pulse" : ""}
                  />
                  
                  {/* Relationship label */}
                  {showLabels && zoomLevel > 0.7 && (
                    <text
                      x={((sourceNode.x + targetNode.x) / 2 + panOffset.x) * zoomLevel}
                      y={((sourceNode.y + targetNode.y) / 2 + panOffset.y) * zoomLevel - 8}
                      fill={color}
                      fontSize={Math.max(10 * zoomLevel, 8)}
                      textAnchor="middle"
                      className="font-mono font-medium"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))' }}
                    >
                      {link.type.replace('_', ' ')}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* CI Nodes */}
          {nodes.map(renderNode)}

          {/* Enhanced Mini-map */}
          <div className="absolute top-4 right-4 w-40 h-32 border rounded bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="text-xs p-2 text-center font-medium border-b bg-muted/50">
              Mini Map ({nodes.length} CIs)
            </div>
            <div className="relative h-24 p-1 overflow-hidden">
              {/* Mini-map connections */}
              <svg className="absolute inset-0 w-full h-full">
                {links.map((link, index) => {
                  const sourceNode = nodes.find(n => n.id === link.source);
                  const targetNode = nodes.find(n => n.id === link.target);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  return (
                    <line
                      key={index}
                      x1={`${(sourceNode.x / 600) * 100}%`}
                      y1={`${(sourceNode.y / 400) * 100}%`}
                      x2={`${(targetNode.x / 600) * 100}%`}
                      y2={`${(targetNode.y / 400) * 100}%`}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="0.5"
                      opacity="0.3"
                    />
                  );
                })}
              </svg>
              
              {/* Mini-map nodes */}
              {nodes.map(node => (
                <TooltipProvider key={`mini-${node.id}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-150 border ${
                          node.ci.status === "Active" || node.ci.status === "Operational" ? "bg-green-500 border-green-600" :
                          node.ci.status === "Maintenance" ? "bg-yellow-500 border-yellow-600" :
                          node.ci.status === "Degraded" ? "bg-orange-500 border-orange-600" : "bg-red-500 border-red-600"
                        } ${selectedNode === node.id ? "ring-2 ring-primary" : ""}`}
                        style={{
                          left: `${(node.x / 600) * 100}%`,
                          top: `${(node.y / 400) * 100}%`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node.id);
                          onCIClick(node.ci);
                          // Pan to node in main view
                          const newPanX = (300 - node.x) * 0.5;
                          const newPanY = (200 - node.y) * 0.5;
                          setPanOffset({ x: newPanX, y: newPanY });
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      <div>{node.ci.name}</div>
                      <div className="text-muted-foreground">{node.ci.status}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              
              {/* Viewport indicator */}
              <div 
                className="absolute border border-primary/50 bg-primary/10 pointer-events-none"
                style={{
                  left: `${Math.max(0, -panOffset.x / 6)}%`,
                  top: `${Math.max(0, -panOffset.y / 4)}%`,
                  width: `${Math.min(100, 100 / zoomLevel)}%`,
                  height: `${Math.min(100, 100 / zoomLevel)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        {showDetails && selectedNode && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4" data-testid="topology-details">
              {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                const ci = node.ci;
                
                return (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      {getTypeIcon(ci.type, "w-5 h-5")}
                      {ci.name} Details
                      <Badge className={
                        ci.status === "Active" ? "bg-green-100 text-green-800" :
                        ci.status === "Maintenance" ? "bg-yellow-100 text-yellow-800" :
                        ci.status === "Degraded" ? "bg-orange-100 text-orange-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {ci.status}
                      </Badge>
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground font-medium">Type:</span>
                        <div>{ci.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Location:</span>
                        <div>{ci.location}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Environment:</span>
                        <div>{ci.environment}</div>
                      </div>
                      {ci.hostname && (
                        <div>
                          <span className="text-muted-foreground font-medium">Hostname:</span>
                          <div className="font-mono text-xs">{ci.hostname}</div>
                        </div>
                      )}
                      {ci.ipAddress && (
                        <div>
                          <span className="text-muted-foreground font-medium">IP Address:</span>
                          <div className="font-mono text-xs">{ci.ipAddress}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground font-medium">Owner:</span>
                        <div>{ci.owner}</div>
                      </div>
                    </div>

                    {/* Related connections */}
                    <div className="mt-4">
                      <span className="text-muted-foreground font-medium">Connections:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {links
                          .filter(link => link.source === selectedNode || link.target === selectedNode)
                          .map((link, idx) => {
                            const otherNodeId = link.source === selectedNode ? link.target : link.source;
                            const otherNode = nodes.find(n => n.id === otherNodeId);
                            return (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {otherNode?.ci.name} ({link.type.replace('_', ' ')})
                              </Badge>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* Enhanced Legend */}
        <div className="mt-4 space-y-3">
          <div className="text-sm font-medium">Legend</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Relationship Types */}
            <div>
              <div className="font-medium mb-2">Relationships</div>
              <div className="space-y-1">
                {[
                  { type: "depends_on", color: "#ef4444", style: "8,4" },
                  { type: "connects_to", color: "#3b82f6", style: "none" },
                  { type: "hosted_on", color: "#10b981", style: "none" },
                  { type: "part_of", color: "#8b5cf6", style: "none" },
                  { type: "manages", color: "#f59e0b", style: "none" }
                ].map(rel => (
                  <div key={rel.type} className="flex items-center gap-2">
                    <svg width="20" height="8">
                      <line
                        x1="0" y1="4" x2="20" y2="4"
                        stroke={rel.color}
                        strokeWidth="2"
                        strokeDasharray={rel.style}
                      />
                    </svg>
                    <span>{rel.type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Colors */}
            <div>
              <div className="font-medium mb-2">Status</div>
              <div className="space-y-1">
                {[
                  { status: "Active", color: "bg-green-500" },
                  { status: "Maintenance", color: "bg-yellow-500" },
                  { status: "Degraded", color: "bg-orange-500" },
                  { status: "Inactive", color: "bg-red-500" }
                ].map(stat => (
                  <div key={stat.status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                    <span>{stat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}