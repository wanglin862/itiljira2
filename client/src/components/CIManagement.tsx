import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Server, 
  Monitor, 
  Database, 
  Network,
  Cloud,
  HardDrive,
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  BarChart3,
  GitBranch,
  Target,
  Zap,
  Settings,
  RefreshCw,
  FileText,
  TrendingUp,
  AlertCircle,
  Layers
} from 'lucide-react';
import type { ConfigurationItem } from '@shared/schema';

interface CIManagementProps {
  onCISelect?: (ci: ConfigurationItem) => void;
}

interface CIFormData {
  name: string;
  type: string;
  status: string;
  location: string;
  ipAddress: string;
  hostname: string;
  operatingSystem: string;
  environment: string;
  businessService: string;
  owner: string;
  description: string;
}

interface CIHealthMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  unit: string;
}

interface CIDiscoveryResult {
  id: string;
  name: string;
  type: string;
  ipAddress: string;
  discovered: boolean;
  confidence: number;
  source: string;
}

export default function CIManagement({ onCISelect }: CIManagementProps) {
  const [cis, setCis] = useState<ConfigurationItem[]>([]);
  const [filteredCis, setFilteredCis] = useState<ConfigurationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [selectedCis, setSelectedCis] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCI, setEditingCI] = useState<ConfigurationItem | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<CIDiscoveryResult[]>([]);
  const [isDiscoveryRunning, setIsDiscoveryRunning] = useState(false);
  const [formData, setFormData] = useState<CIFormData>({
    name: '',
    type: 'Server',
    status: 'Active',
    location: '',
    ipAddress: '',
    hostname: '',
    operatingSystem: '',
    environment: 'Production',
    businessService: '',
    owner: '',
    description: ''
  });

  // Mock CI data
  const mockCIs: ConfigurationItem[] = [
    {
      id: '1',
      name: 'WEB-PROD-01',
      type: 'Server',
      status: 'Active',
      location: 'DC-East-Rack-A12',
      ipAddress: '192.168.1.100',
      hostname: 'web-prod-01.company.com',
      operatingSystem: 'Ubuntu 20.04 LTS',
      environment: 'Production',
      businessService: 'E-commerce Platform',
      owner: 'DevOps Team',
      metadata: { cpuCores: 16, ramGB: 64, diskGB: 500 },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-22')
    },
    {
      id: '2',
      name: 'DB-PROD-01',
      type: 'Database',
      status: 'Active',
      location: 'DC-East-Rack-B05',
      ipAddress: '192.168.1.200',
      hostname: 'db-prod-01.company.com',
      operatingSystem: 'PostgreSQL 14',
      environment: 'Production',
      businessService: 'Database Services',
      owner: 'DBA Team',
      metadata: { version: '14.2', connections: 100, storage: '2TB' },
      createdAt: new Date('2025-08-15'),
      updatedAt: new Date('2025-09-20')
    },
    {
      id: '3',
      name: 'LB-PROD-01',
      type: 'Network',
      status: 'Maintenance',
      location: 'DC-East-Rack-C01',
      ipAddress: '192.168.1.50',
      hostname: 'lb-prod-01.company.com',
      operatingSystem: 'F5 TMOS',
      environment: 'Production',
      businessService: 'Load Balancing',
      owner: 'Network Team',
      metadata: { throughput: '10Gbps', connections: 10000 },
      createdAt: new Date('2025-07-20'),
      updatedAt: new Date('2025-09-21')
    },
    {
      id: '4',
      name: 'STORAGE-PROD-01',
      type: 'Storage',
      status: 'Active',
      location: 'DC-East-Rack-D10',
      ipAddress: '192.168.1.250',
      hostname: 'storage-prod-01.company.com',
      operatingSystem: 'NetApp ONTAP',
      environment: 'Production',
      businessService: 'Data Storage',
      owner: 'Storage Team',
      metadata: { capacity: '50TB', used: '35TB', raid: 'RAID6' },
      createdAt: new Date('2025-06-10'),
      updatedAt: new Date('2025-09-19')
    },
    {
      id: '5',
      name: 'API-SERVICE-01',
      type: 'Service',
      status: 'Active',
      location: 'Cloud-AWS-US-East',
      ipAddress: '10.0.1.100',
      hostname: 'api.company.com',
      operatingSystem: 'Docker Container',
      environment: 'Production',
      businessService: 'API Gateway',
      owner: 'DevOps Team',
      metadata: { replicas: 3, cpu: '2 cores', memory: '4GB' },
      createdAt: new Date('2025-08-01'),
      updatedAt: new Date('2025-09-22')
    },
    {
      id: '6',
      name: 'FIREWALL-01',
      type: 'Security',
      status: 'Active',
      location: 'DC-East-Perimeter',
      ipAddress: '192.168.1.1',
      hostname: 'fw-01.company.com',
      operatingSystem: 'Fortinet FortiOS',
      environment: 'Production',
      businessService: 'Network Security',
      owner: 'Security Team',
      metadata: { rules: 500, throughput: '5Gbps' },
      createdAt: new Date('2025-05-15'),
      updatedAt: new Date('2025-09-18')
    }
  ];

  // Mock discovery results
  const mockDiscoveryResults: CIDiscoveryResult[] = [
    {
      id: 'disc-1',
      name: 'JENKINS-BUILD-01',
      type: 'Server',
      ipAddress: '192.168.1.150',
      discovered: false,
      confidence: 95,
      source: 'Network Scan'
    },
    {
      id: 'disc-2',
      name: 'REDIS-CACHE-01',
      type: 'Database',
      ipAddress: '192.168.1.180',
      discovered: false,
      confidence: 88,
      source: 'Service Discovery'
    },
    {
      id: 'disc-3',
      name: 'NGINX-PROXY-01',
      type: 'Network',
      ipAddress: '192.168.1.80',
      discovered: false,
      confidence: 92,
      source: 'Port Scan'
    }
  ];

  // Health metrics for CIs
  const ciHealthMetrics: Record<string, CIHealthMetric[]> = {
    '1': [
      { name: 'CPU Usage', value: 68, threshold: 80, status: 'good', unit: '%' },
      { name: 'Memory Usage', value: 82, threshold: 85, status: 'warning', unit: '%' },
      { name: 'Disk Usage', value: 45, threshold: 90, status: 'good', unit: '%' },
      { name: 'Network I/O', value: 25, threshold: 70, status: 'good', unit: 'Mbps' }
    ],
    '2': [
      { name: 'Connections', value: 75, threshold: 90, status: 'good', unit: 'count' },
      { name: 'Query Response', value: 150, threshold: 200, status: 'good', unit: 'ms' },
      { name: 'Storage Usage', value: 68, threshold: 80, status: 'good', unit: '%' },
      { name: 'Replication Lag', value: 2, threshold: 5, status: 'good', unit: 's' }
    ]
  };

  useEffect(() => {
    setCis(mockCIs);
    setDiscoveryResults(mockDiscoveryResults);
  }, []);

  useEffect(() => {
    let filtered = cis;

    if (searchTerm) {
      filtered = filtered.filter(ci => 
        ci.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ci.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ci.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ci.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(ci => ci.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ci => ci.status === statusFilter);
    }

    if (environmentFilter !== 'all') {
      filtered = filtered.filter(ci => ci.environment === environmentFilter);
    }

    setFilteredCis(filtered);
  }, [cis, searchTerm, typeFilter, statusFilter, environmentFilter]);

  const getTypeIcon = (type: string, size = "w-5 h-5") => {
    const iconClass = `${size}`;
    switch (type.toLowerCase()) {
      case 'server': return <Server className={`${iconClass} text-blue-600`} />;
      case 'database': return <Database className={`${iconClass} text-green-600`} />;
      case 'network': return <Network className={`${iconClass} text-orange-600`} />;
      case 'storage': return <HardDrive className={`${iconClass} text-purple-600`} />;
      case 'service': return <Cloud className={`${iconClass} text-indigo-600`} />;
      case 'security': return <Shield className={`${iconClass} text-red-600`} />;
      default: return <Server className={`${iconClass} text-gray-600`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleCreateCI = () => {
    const newCI: ConfigurationItem = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: null
    };
    setCis(prev => [...prev, newCI]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditCI = () => {
    if (!editingCI) return;
    
    const updatedCI = {
      ...editingCI,
      ...formData,
      updatedAt: new Date()
    };
    
    setCis(prev => prev.map(ci => ci.id === editingCI.id ? updatedCI : ci));
    setIsEditDialogOpen(false);
    setEditingCI(null);
    resetForm();
  };

  const handleDeleteCI = (ciId: string) => {
    setCis(prev => prev.filter(ci => ci.id !== ciId));
    setSelectedCis(prev => prev.filter(id => id !== ciId));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Server',
      status: 'Active',
      location: '',
      ipAddress: '',
      hostname: '',
      operatingSystem: '',
      environment: 'Production',
      businessService: '',
      owner: '',
      description: ''
    });
  };

  const startEdit = (ci: ConfigurationItem) => {
    setEditingCI(ci);
    setFormData({
      name: ci.name,
      type: ci.type,
      status: ci.status,
      location: ci.location || '',
      ipAddress: ci.ipAddress || '',
      hostname: ci.hostname || '',
      operatingSystem: ci.operatingSystem || '',
      environment: ci.environment || 'Production',
      businessService: ci.businessService || '',
      owner: ci.owner || '',
      description: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'delete':
        setCis(prev => prev.filter(ci => !selectedCis.includes(ci.id)));
        setSelectedCis([]);
        break;
      case 'activate':
        setCis(prev => prev.map(ci => 
          selectedCis.includes(ci.id) ? { ...ci, status: 'Active' } : ci
        ));
        break;
      case 'maintenance':
        setCis(prev => prev.map(ci => 
          selectedCis.includes(ci.id) ? { ...ci, status: 'Maintenance' } : ci
        ));
        break;
    }
  };

  const runDiscovery = () => {
    setIsDiscoveryRunning(true);
    setTimeout(() => {
      setIsDiscoveryRunning(false);
      // Mock adding more discovery results
      setDiscoveryResults(prev => [...prev, {
        id: 'disc-new',
        name: 'DISCOVERED-SERVER-01',
        type: 'Server',
        ipAddress: '192.168.1.220',
        discovered: false,
        confidence: 87,
        source: 'Auto Discovery'
      }]);
    }, 3000);
  };

  const importDiscoveredCI = (result: CIDiscoveryResult) => {
    const newCI: ConfigurationItem = {
      id: Date.now().toString(),
      name: result.name,
      type: result.type,
      status: 'Active',
      ipAddress: result.ipAddress,
      environment: 'Production',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { discoverySource: result.source, confidence: result.confidence }
    };
    
    setCis(prev => [...prev, newCI]);
    setDiscoveryResults(prev => prev.map(r => 
      r.id === result.id ? { ...r, discovered: true } : r
    ));
  };

  const renderCICard = (ci: ConfigurationItem) => {
    const isSelected = selectedCis.includes(ci.id);
    const healthMetrics = ciHealthMetrics[ci.id] || [];
    
    return (
      <Card 
        key={ci.id} 
        className={`hover:shadow-md transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onCISelect?.(ci)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCis(prev => [...prev, ci.id]);
                  } else {
                    setSelectedCis(prev => prev.filter(id => id !== ci.id));
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {getTypeIcon(ci.type)}
              <div>
                <CardTitle className="text-lg">{ci.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(ci.status)}>
                    {ci.status}
                  </Badge>
                  <Badge variant="outline">{ci.type}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(ci);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit CI</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCI(ci.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete CI</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ci.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{ci.location}</span>
              </div>
            )}
            {ci.ipAddress && (
              <div className="flex items-center gap-1">
                <Network className="w-3 h-3 text-muted-foreground" />
                <span>{ci.ipAddress}</span>
              </div>
            )}
            {ci.environment && (
              <div className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-muted-foreground" />
                <span>{ci.environment}</span>
              </div>
            )}
            {ci.owner && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{ci.owner}</span>
              </div>
            )}
          </div>

          {/* Health Metrics */}
          {healthMetrics.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Health Status</div>
              {healthMetrics.slice(0, 2).map((metric, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{metric.name}</span>
                    <span className={
                      metric.status === 'good' ? 'text-green-600' :
                      metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }>
                      {metric.value}{metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={metric.value} 
                    className="h-1"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Updated: {ci.updatedAt ? new Date(ci.updatedAt).toLocaleDateString() : 'N/A'}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFormDialog = (isEdit = false) => (
    <Dialog open={isEdit ? isEditDialogOpen : isCreateDialogOpen} onOpenChange={isEdit ? setIsEditDialogOpen : setIsCreateDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Configuration Item' : 'Create New Configuration Item'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., WEB-PROD-01"
              />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Server">Server</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Storage">Storage</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select value={formData.environment} onValueChange={(value) => setFormData(prev => ({ ...prev, environment: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Staging">Staging</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={formData.ipAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                value={formData.hostname}
                onChange={(e) => setFormData(prev => ({ ...prev, hostname: e.target.value }))}
                placeholder="web-prod-01.company.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="DC-East-Rack-A12"
            />
          </div>

          <div>
            <Label htmlFor="operatingSystem">Operating System</Label>
            <Input
              id="operatingSystem"
              value={formData.operatingSystem}
              onChange={(e) => setFormData(prev => ({ ...prev, operatingSystem: e.target.value }))}
              placeholder="Ubuntu 20.04 LTS"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessService">Business Service</Label>
              <Input
                id="businessService"
                value={formData.businessService}
                onChange={(e) => setFormData(prev => ({ ...prev, businessService: e.target.value }))}
                placeholder="E-commerce Platform"
              />
            </div>
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="DevOps Team"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional information about this CI"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              if (isEdit) {
                setIsEditDialogOpen(false);
                setEditingCI(null);
              } else {
                setIsCreateDialogOpen(false);
              }
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={isEdit ? handleEditCI : handleCreateCI}>
              {isEdit ? 'Update' : 'Create'} CI
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Configuration Items</h1>
          <p className="text-muted-foreground">Manage your IT infrastructure components</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add CI
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search CIs by name, type, hostname, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Server">Server</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Storage">Storage</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Staging">Staging</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total CIs</p>
                    <p className="text-2xl font-bold">{cis.length}</p>
                  </div>
                  <Server className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {cis.filter(ci => ci.status === 'Active').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {cis.filter(ci => ci.status === 'Maintenance').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold text-red-600">
                      {cis.filter(ci => ci.status === 'Inactive').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedCis.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedCis.length} item(s) selected
              </span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('maintenance')}>
                Maintenance
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                Delete
              </Button>
            </div>
          )}

          {/* CI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCis.map(renderCICard)}
          </div>

          {filteredCis.length === 0 && (
            <div className="text-center py-12">
              <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No Configuration Items found</p>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First CI
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Discovery Tab */}
        <TabsContent value="discovery" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CI Discovery</CardTitle>
                  <p className="text-sm text-muted-foreground">Automatically discover new configuration items</p>
                </div>
                <Button onClick={runDiscovery} disabled={isDiscoveryRunning}>
                  {isDiscoveryRunning ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {isDiscoveryRunning ? 'Scanning...' : 'Run Discovery'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discoveryResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(result.type)}
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.ipAddress} • {result.source} • {result.confidence}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.discovered ? (
                        <Badge className="bg-green-100 text-green-800">Imported</Badge>
                      ) : (
                        <Button size="sm" onClick={() => importDiscoveredCI(result)}>
                          Import
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {discoveryResults.length === 0 && !isDiscoveryRunning && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No discovered items yet. Run discovery to find new CIs.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(ciHealthMetrics).map(([ciId, metrics]) => {
              const ci = cis.find(c => c.id === ciId);
              if (!ci) return null;
              
              return (
                <Card key={ciId}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ci.type)}
                      <CardTitle className="text-lg">{ci.name}</CardTitle>
                      <Badge className={getStatusColor(ci.status)}>{ci.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.map((metric, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{metric.name}</span>
                            <span className={`text-sm font-medium ${
                              metric.status === 'good' ? 'text-green-600' :
                              metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {metric.value}{metric.unit}
                            </span>
                          </div>
                          <Progress 
                            value={(metric.value / metric.threshold) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0{metric.unit}</span>
                            <span>Threshold: {metric.threshold}{metric.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Lifecycle Tab */}
        <TabsContent value="lifecycle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CI Lifecycle Management</CardTitle>
              <p className="text-sm text-muted-foreground">Track configuration items through their lifecycle stages</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cis.slice(0, 3).map((ci) => (
                  <div key={ci.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(ci.type)}
                        <span className="font-medium">{ci.name}</span>
                      </div>
                      <Badge className={getStatusColor(ci.status)}>{ci.status}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Lifecycle Progress</span>
                        <span>Phase 3 of 5</span>
                      </div>
                      <Progress value={60} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Deployed</span>
                        <span>Next: Optimization</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Compliant</p>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Non-Compliant</p>
                    <p className="text-2xl font-bold text-red-600">12%</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Under Review</p>
                    <p className="text-2xl font-bold text-yellow-600">3%</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { ci: 'WEB-PROD-01', issue: 'Outdated security patches', severity: 'High' },
                  { ci: 'DB-PROD-01', issue: 'Missing backup verification', severity: 'Medium' },
                  { ci: 'LB-PROD-01', issue: 'Certificate expiring soon', severity: 'High' }
                ].map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{issue.ci}</p>
                      <p className="text-sm text-muted-foreground">{issue.issue}</p>
                    </div>
                    <Badge className={
                      issue.severity === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }>
                      {issue.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialogs */}
      {renderFormDialog(false)}
      {renderFormDialog(true)}
    </div>
  );
}
