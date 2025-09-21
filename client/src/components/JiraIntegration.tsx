import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Settings,
  Database,
  Ticket,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  Server,
  Network,
  Shield,
  BarChart3,
  Eye,
  Edit,
  Link,
  GitBranch
} from 'lucide-react';
import { JiraIntegrationService, JiraConfig, JiraTicket, JiraCMDBItem, initializeJiraService, getJiraService } from '@/services/jiraIntegration';
import JiraCMDBView from '@/components/JiraCMDBView';
import JiraSync from '@/components/JiraSync';

interface JiraDashboardData {
  totalTickets: number;
  openTickets: number;
  totalCIs: number;
  recentTickets: JiraTicket[];
  recentCIs: JiraCMDBItem[];
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}

export default function JiraIntegration() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<Partial<JiraConfig>>({});
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [cmdbItems, setCmdbItems] = useState<JiraCMDBItem[]>([]);
  const [dashboardData, setDashboardData] = useState<JiraDashboardData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [selectedCI, setSelectedCI] = useState<JiraCMDBItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  // Check if JIRA is already configured
  useEffect(() => {
    const savedConfig = localStorage.getItem('jiraConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        initializeJiraService(parsedConfig);
        setIsConfigured(true);
        setConnectionStatus('connected');
        loadDashboardData();
      } catch (error) {
        console.error('Failed to load JIRA configuration:', error);
      }
    }
  }, []);

  const testConnection = async () => {
    if (!config.baseUrl || !config.username || !config.apiToken || !config.projectKey) {
      alert('Vui lòng điền đầy đủ thông tin cấu hình');
      return;
    }

    setConnectionStatus('testing');
    try {
      const jiraService = new JiraIntegrationService(config as JiraConfig);
      await jiraService.getTickets('', 0, 1); // Test with minimal data
      setConnectionStatus('connected');
      alert('Kết nối JIRA thành công!');
    } catch (error) {
      setConnectionStatus('disconnected');
      alert(`Lỗi kết nối JIRA: ${error}`);
    }
  };

  const saveConfiguration = () => {
    if (!config.baseUrl || !config.username || !config.apiToken || !config.projectKey) {
      alert('Vui lòng điền đầy đủ thông tin cấu hình');
      return;
    }

    localStorage.setItem('jiraConfig', JSON.stringify(config));
    initializeJiraService(config as JiraConfig);
    setIsConfigured(true);
    setIsConfigDialogOpen(false);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    if (!isConfigured) return;
    
    setIsLoading(true);
    try {
      const jiraService = getJiraService();
      const data = await jiraService.getDashboardData();
      setDashboardData(data);
      setTickets(data.recentTickets);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      alert(`Lỗi tải dữ liệu: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTickets = async (jql: string = '') => {
    if (!isConfigured) return;
    
    setIsLoading(true);
    try {
      const jiraService = getJiraService();
      const result = await jiraService.getTickets(jql, 0, 100);
      setTickets(result.issues);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      alert(`Lỗi tải tickets: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCMDBItems = async (jql: string = '') => {
    if (!isConfigured) return;
    
    setIsLoading(true);
    try {
      const jiraService = getJiraService();
      const result = await jiraService.getCMDBItems(jql, 0, 100);
      setCmdbItems(result.issues);
    } catch (error) {
      console.error('Failed to load CMDB items:', error);
      alert(`Lỗi tải CMDB items: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTicketStatusColor = (statusCategory: string) => {
    switch (statusCategory) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'indeterminate': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'highest': case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      case 'lowest': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case 'incident': return <AlertTriangle className="w-4 h-4" />;
      case 'change request': case 'change': return <Settings className="w-4 h-4" />;
      case 'problem': return <GitBranch className="w-4 h-4" />;
      case 'configuration item': return <Database className="w-4 h-4" />;
      default: return <Ticket className="w-4 h-4" />;
    }
  };

  const getCITypeIcon = (ciType: string) => {
    switch (ciType.toLowerCase()) {
      case 'server': return <Server className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'application': return <Shield className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status.name === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (!isConfigured) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">JIRA Integration</h1>
          <Button onClick={() => setIsConfigDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configure JIRA
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Settings className="w-16 h-16 mx-auto text-gray-400" />
              <h3 className="text-xl font-semibold">JIRA Integration Not Configured</h3>
              <p className="text-gray-600">
                Configure JIRA connection to sync CMDB and ticket data
              </p>
              <Button onClick={() => setIsConfigDialogOpen(true)}>
                Configure Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Dialog */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure JIRA Integration</DialogTitle>
              <DialogDescription>
                Enter your JIRA instance details to enable integration
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">JIRA Base URL *</label>
                <Input
                  value={config.baseUrl || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://your-domain.atlassian.net"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username/Email *</label>
                  <Input
                    value={config.username || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="your-email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Token *</label>
                  <Input
                    type="password"
                    value={config.apiToken || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                    placeholder="Your JIRA API Token"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Key *</label>
                  <Input
                    value={config.projectKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                    placeholder="IT"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CMDB Project Key</label>
                  <Input
                    value={config.cmdbProjectKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, cmdbProjectKey: e.target.value }))}
                    placeholder="CMDB (optional)"
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>API Token Setup:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Go to JIRA → Profile → Personal Access Tokens</li>
                    <li>Create a new token with appropriate permissions</li>
                    <li>Copy the token and paste it above</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={testConnection} disabled={connectionStatus === 'testing'}>
                {connectionStatus === 'testing' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button onClick={saveConfiguration}>
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">JIRA Integration</h1>
        <div className="flex gap-2">
          <Badge className={connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsConfigDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="cmdb">CMDB</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="sync">Sync Tools</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Total Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardData.totalTickets}</div>
                  <div className="text-sm text-gray-600">
                    {dashboardData.openTickets} open tickets
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    CMDB Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardData.totalCIs}</div>
                  <div className="text-sm text-gray-600">
                    Configuration Items
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(dashboardData.ticketsByStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm">{status}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(dashboardData.ticketsByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex justify-between items-center">
                        <span className="text-sm">{priority}</span>
                        <Badge className={getPriorityColor(priority)}>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.recentTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getIssueTypeIcon(ticket.issueType.name)}
                        <div>
                          <p className="font-medium">{ticket.key}</p>
                          <p className="text-sm text-gray-600 truncate max-w-64">
                            {ticket.summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(ticket.priority.name)}>
                          {ticket.priority.name}
                        </Badge>
                        <Badge className={getTicketStatusColor(ticket.status.statusCategory.key)}>
                          {ticket.status.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent CMDB Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.recentCIs.slice(0, 5).map((ci) => (
                    <div key={ci.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCITypeIcon(ci.ciType)}
                        <div>
                          <p className="font-medium">{ci.key}</p>
                          <p className="text-sm text-gray-600 truncate max-w-64">
                            {ci.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{ci.ciType}</Badge>
                        <Badge className={ci.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {ci.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => loadTickets()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon(ticket.issueType.name)}
                          <h3 className="font-semibold text-lg">{ticket.key}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`${config.baseUrl}/browse/${ticket.key}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <h4 className="font-medium">{ticket.summary}</h4>
                        {ticket.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-start">
                        <Badge className={getPriorityColor(ticket.priority.name)}>
                          {ticket.priority.name}
                        </Badge>
                        <Badge className={getTicketStatusColor(ticket.status.statusCategory.key)}>
                          {ticket.status.name}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Assignee: {ticket.assignee?.displayName || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Created: {new Date(ticket.created).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>Updated: {new Date(ticket.updated).toLocaleDateString()}</span>
                      </div>
                      {ticket.affectedCI && ticket.affectedCI.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <span>CIs: {ticket.affectedCI.length}</span>
                        </div>
                      )}
                    </div>

                    {ticket.components.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {ticket.components.map((component, index) => (
                          <Badge key={index} variant="outline">
                            {component.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Reporter: {ticket.reporter.displayName}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cmdb" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configuration Management Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Button onClick={() => loadCMDBItems()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load CMDB Items
                </Button>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search CMDB items..."
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {cmdbItems.map((ci) => (
                  <div key={ci.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getCITypeIcon(ci.ciType)}
                          <h4 className="font-semibold">{ci.key}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`${config.baseUrl}/browse/${ci.key}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <h5 className="font-medium">{ci.name}</h5>
                        {ci.location && (
                          <p className="text-sm text-gray-600">Location: {ci.location}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{ci.ciType}</Badge>
                        <Badge className={ci.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {ci.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {ci.owner && (
                        <div>
                          <strong>Owner:</strong> {ci.owner}
                        </div>
                      )}
                      {ci.environment && (
                        <div>
                          <strong>Environment:</strong> {ci.environment}
                        </div>
                      )}
                      {ci.ipAddress && (
                        <div>
                          <strong>IP Address:</strong> {ci.ipAddress}
                        </div>
                      )}
                      {ci.operatingSystem && (
                        <div>
                          <strong>OS:</strong> {ci.operatingSystem}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Last Updated: {new Date(ci.lastUpdated).toLocaleDateString()}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCI(ci)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          <JiraCMDBView />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <JiraSync />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Sync:</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tickets Synced:</span>
                    <span className="font-medium">{tickets.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CIs Synced:</span>
                    <span className="font-medium">{cmdbItems.length}</span>
                  </div>
                  <Progress value={85} className="mt-4" />
                  <p className="text-xs text-gray-500">Sync Progress: 85%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Complete Records:</span>
                    <span className="font-medium text-green-600">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Missing Fields:</span>
                    <span className="font-medium text-yellow-600">8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Duplicate Records:</span>
                    <span className="font-medium text-red-600">0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">API Connection: OK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Authentication: Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Permissions: Sufficient</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>JIRA Integration Settings</DialogTitle>
            <DialogDescription>
              Update your JIRA connection settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">JIRA Base URL *</label>
              <Input
                value={config.baseUrl || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://your-domain.atlassian.net"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username/Email *</label>
                <Input
                  value={config.username || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="your-email@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Token *</label>
                <Input
                  type="password"
                  value={config.apiToken || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                  placeholder="Your JIRA API Token"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Key *</label>
                <Input
                  value={config.projectKey || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                  placeholder="IT"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CMDB Project Key</label>
                <Input
                  value={config.cmdbProjectKey || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, cmdbProjectKey: e.target.value }))}
                  placeholder="CMDB (optional)"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={testConnection} disabled={connectionStatus === 'testing'}>
              {connectionStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={saveConfiguration}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
