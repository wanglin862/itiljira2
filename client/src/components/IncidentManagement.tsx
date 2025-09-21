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
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Webhook,
  Clock,
  Users,
  Target,
  FileText,
  Database,
  Lightbulb,
  Megaphone,
  BarChart3,
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Tag
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  impact: 'High' | 'Medium' | 'Low';
  urgency: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: string;
  assignedGroup: string;
  reportedBy: string;
  reportedVia: 'Email' | 'Phone' | 'Self-Service' | 'Chatbot' | 'Monitoring' | 'Walk-in';
  ciId?: string;
  ciName?: string;
  slaResponseTime: number; // minutes
  slaResolutionTime: number; // minutes
  timeToResponse?: number;
  timeToResolution?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  isMajorIncident: boolean;
  knowledgeArticles: string[];
  relatedIncidents: string[];
}

interface IncidentTemplate {
  id: string;
  name: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  impact: string;
  urgency: string;
  assignedGroup: string;
  workflow: string[];
  knowledgeLinks: string[];
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  lastUpdated: Date;
}

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [templates, setTemplates] = useState<IncidentTemplate[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeArticle[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newIncident, setNewIncident] = useState<Partial<Incident>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Mock data initialization
  useEffect(() => {
    const mockIncidents: Incident[] = [
      {
        id: 'INC-001',
        title: 'Email service outage - Exchange Server down',
        description: 'Users unable to send/receive emails. Exchange server appears to be down.',
        category: 'Email & Communication',
        subcategory: 'Email Server',
        priority: 'P1',
        impact: 'High',
        urgency: 'High',
        status: 'In Progress',
        assignedTo: 'John Smith',
        assignedGroup: 'L2-Infrastructure',
        reportedBy: 'Sarah Johnson',
        reportedVia: 'Phone',
        ciId: 'ci-005',
        ciName: 'Exchange Server 01',
        slaResponseTime: 15,
        slaResolutionTime: 240,
        timeToResponse: 12,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        isMajorIncident: true,
        knowledgeArticles: ['KB-001', 'KB-002'],
        relatedIncidents: ['INC-002']
      },
      {
        id: 'INC-002',
        title: 'Slow network performance in Building A',
        description: 'Multiple users reporting slow network connectivity in Building A, 3rd floor.',
        category: 'Network & Connectivity',
        subcategory: 'Network Performance',
        priority: 'P2',
        impact: 'Medium',
        urgency: 'High',
        status: 'Assigned',
        assignedTo: 'Mike Wilson',
        assignedGroup: 'L1-Network',
        reportedBy: 'IT Helpdesk',
        reportedVia: 'Self-Service',
        ciId: 'ci-006',
        ciName: 'Network Switch - Building A',
        slaResponseTime: 30,
        slaResolutionTime: 480,
        timeToResponse: 25,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        isMajorIncident: false,
        knowledgeArticles: ['KB-003'],
        relatedIncidents: []
      },
      {
        id: 'INC-003',
        title: 'VPN connection issues',
        description: 'Remote users unable to connect to VPN. Authentication failures.',
        category: 'Network & Connectivity',
        subcategory: 'VPN',
        priority: 'P3',
        impact: 'Medium',
        urgency: 'Medium',
        status: 'New',
        assignedTo: '',
        assignedGroup: 'L1-Support',
        reportedBy: 'Remote User',
        reportedVia: 'Email',
        slaResponseTime: 60,
        slaResolutionTime: 1440,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        isMajorIncident: false,
        knowledgeArticles: [],
        relatedIncidents: []
      }
    ];

    const mockTemplates: IncidentTemplate[] = [
      {
        id: 'TPL-001',
        name: 'Email Outage',
        category: 'Email & Communication',
        title: 'Email service outage',
        description: 'Users unable to access email services',
        priority: 'P1',
        impact: 'High',
        urgency: 'High',
        assignedGroup: 'L2-Infrastructure',
        workflow: ['Initial Assessment', 'Service Restart', 'Verify Resolution', 'Communication'],
        knowledgeLinks: ['KB-001', 'KB-002']
      },
      {
        id: 'TPL-002',
        name: 'Network Performance',
        category: 'Network & Connectivity',
        title: 'Network performance issues',
        description: 'Users experiencing slow network connectivity',
        priority: 'P2',
        impact: 'Medium',
        urgency: 'Medium',
        assignedGroup: 'L1-Network',
        workflow: ['Bandwidth Check', 'Switch Analysis', 'Cable Testing', 'Resolution'],
        knowledgeLinks: ['KB-003', 'KB-004']
      },
      {
        id: 'TPL-003',
        name: 'Application Error',
        category: 'Applications',
        title: 'Application not responding',
        description: 'Business application showing errors or not responding',
        priority: 'P2',
        impact: 'Medium',
        urgency: 'High',
        assignedGroup: 'L1-Application',
        workflow: ['Error Analysis', 'Service Restart', 'Database Check', 'User Notification'],
        knowledgeLinks: ['KB-005']
      }
    ];

    const mockKnowledgeBase: KnowledgeArticle[] = [
      {
        id: 'KB-001',
        title: 'Exchange Server Troubleshooting Guide',
        content: 'Step-by-step guide to troubleshoot Exchange server issues...',
        category: 'Email & Communication',
        tags: ['exchange', 'email', 'troubleshooting'],
        views: 245,
        helpful: 89,
        lastUpdated: new Date('2025-09-15')
      },
      {
        id: 'KB-002',
        title: 'Email Service Recovery Procedures',
        content: 'Recovery procedures for email service outages...',
        category: 'Email & Communication',
        tags: ['email', 'recovery', 'outage'],
        views: 156,
        helpful: 67,
        lastUpdated: new Date('2025-09-10')
      },
      {
        id: 'KB-003',
        title: 'Network Performance Optimization',
        content: 'Best practices for network performance troubleshooting...',
        category: 'Network & Connectivity',
        tags: ['network', 'performance', 'optimization'],
        views: 189,
        helpful: 72,
        lastUpdated: new Date('2025-09-12')
      }
    ];

    setIncidents(mockIncidents);
    setTemplates(mockTemplates);
    setKnowledgeBase(mockKnowledgeBase);
  }, []);

  const calculatePriority = (impact: string, urgency: string): string => {
    const matrix: Record<string, Record<string, string>> = {
      'High': { 'High': 'P1', 'Medium': 'P2', 'Low': 'P3' },
      'Medium': { 'High': 'P2', 'Medium': 'P3', 'Low': 'P4' },
      'Low': { 'High': 'P3', 'Medium': 'P4', 'Low': 'P5' }
    };
    return matrix[impact]?.[urgency] || 'P4';
  };

  const getSLATime = (priority: string, type: 'response' | 'resolution'): number => {
    const slaMatrix: Record<string, { response: number; resolution: number }> = {
      'P1': { response: 15, resolution: 240 },
      'P2': { response: 30, resolution: 480 },
      'P3': { response: 60, resolution: 1440 },
      'P4': { response: 120, resolution: 2880 },
      'P5': { response: 240, resolution: 5760 }
    };
    return slaMatrix[priority]?.[type] || 240;
  };

  const autoAssignGroup = (category: string, priority: string): string => {
    const assignmentRules: Record<string, Record<string, string>> = {
      'Email & Communication': { 'P1': 'L2-Infrastructure', 'P2': 'L1-Infrastructure', default: 'L1-Support' },
      'Network & Connectivity': { 'P1': 'L2-Network', 'P2': 'L1-Network', default: 'L1-Support' },
      'Applications': { 'P1': 'L2-Application', 'P2': 'L1-Application', default: 'L1-Support' },
      'Hardware': { 'P1': 'L2-Hardware', 'P2': 'L1-Hardware', default: 'L1-Support' }
    };
    
    return assignmentRules[category]?.[priority] || 
           assignmentRules[category]?.default || 
           'L1-Support';
  };

  const createIncident = () => {
    if (!newIncident.title || !newIncident.category) return;

    const priority = calculatePriority(newIncident.impact || 'Medium', newIncident.urgency || 'Medium');
    const assignedGroup = autoAssignGroup(newIncident.category, priority);

    const incident: Incident = {
      id: `INC-${String(incidents.length + 1).padStart(3, '0')}`,
      title: newIncident.title,
      description: newIncident.description || '',
      category: newIncident.category,
      subcategory: newIncident.subcategory || '',
      priority: priority as any,
      impact: (newIncident.impact || 'Medium') as any,
      urgency: (newIncident.urgency || 'Medium') as any,
      status: 'New',
      assignedTo: '',
      assignedGroup: assignedGroup,
      reportedBy: newIncident.reportedBy || 'System',
      reportedVia: (newIncident.reportedVia || 'Self-Service') as any,
      ciId: newIncident.ciId,
      ciName: newIncident.ciName,
      slaResponseTime: getSLATime(priority, 'response'),
      slaResolutionTime: getSLATime(priority, 'resolution'),
      createdAt: new Date(),
      updatedAt: new Date(),
      isMajorIncident: priority === 'P1',
      knowledgeArticles: [],
      relatedIncidents: []
    };

    setIncidents(prev => [incident, ...prev]);
    setNewIncident({});
    setIsCreateDialogOpen(false);
  };

  const useTemplate = (template: IncidentTemplate) => {
    setNewIncident({
      title: template.title,
      description: template.description,
      category: template.category,
      impact: template.impact as any,
      urgency: template.urgency as any,
      assignedGroup: template.assignedGroup
    });
  };

  const escalateIncident = (incident: Incident) => {
    let newGroup = incident.assignedGroup;
    if (incident.assignedGroup.includes('L1')) {
      newGroup = incident.assignedGroup.replace('L1', 'L2');
    } else if (incident.assignedGroup.includes('L2')) {
      newGroup = incident.assignedGroup.replace('L2', 'L3');
    }

    const updatedIncident = {
      ...incident,
      assignedGroup: newGroup,
      priority: incident.priority === 'P3' ? 'P2' : incident.priority === 'P2' ? 'P1' : incident.priority,
      updatedAt: new Date()
    };

    setIncidents(prev => prev.map(inc => inc.id === incident.id ? updatedIncident : inc));
  };

  const getSLAStatus = (incident: Incident): { status: string; color: string; remaining: number } => {
    const now = new Date();
    const created = new Date(incident.createdAt);
    const elapsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (incident.status === 'Resolved' || incident.status === 'Closed') {
      return { status: 'Met', color: 'text-green-600', remaining: 0 };
    }

    const slaTime = incident.status === 'New' ? incident.slaResponseTime : incident.slaResolutionTime;
    const remaining = slaTime - elapsed;

    if (remaining <= 0) {
      return { status: 'Breached', color: 'text-red-600', remaining: 0 };
    } else if (remaining <= slaTime * 0.2) {
      return { status: 'At Risk', color: 'text-orange-600', remaining };
    } else {
      return { status: 'On Track', color: 'text-green-600', remaining };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-500';
      case 'P2': return 'bg-orange-500';
      case 'P3': return 'bg-yellow-500';
      case 'P4': return 'bg-blue-500';
      case 'P5': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      case 'Self-Service': return <User className="w-4 h-4" />;
      case 'Chatbot': return <MessageCircle className="w-4 h-4" />;
      case 'Monitoring': return <Webhook className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || incident.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Incident Management</h1>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>
                  Fill in the incident details. Priority will be calculated automatically based on Impact and Urgency.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={newIncident.title || ''}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reported Via</label>
                    <Select onValueChange={(value) => setNewIncident(prev => ({ ...prev, reportedVia: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Self-Service">Self-Service Portal</SelectItem>
                        <SelectItem value="Chatbot">Chatbot</SelectItem>
                        <SelectItem value="Monitoring">Monitoring Tool</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newIncident.description || ''}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the incident"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <Select onValueChange={(value) => setNewIncident(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email & Communication">Email & Communication</SelectItem>
                        <SelectItem value="Network & Connectivity">Network & Connectivity</SelectItem>
                        <SelectItem value="Applications">Applications</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Database">Database</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subcategory</label>
                    <Input
                      value={newIncident.subcategory || ''}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, subcategory: e.target.value }))}
                      placeholder="Specific subcategory"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Impact</label>
                    <Select onValueChange={(value) => setNewIncident(prev => ({ ...prev, impact: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High - Multiple users/services</SelectItem>
                        <SelectItem value="Medium">Medium - Some users/services</SelectItem>
                        <SelectItem value="Low">Low - Single user/minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Urgency</label>
                    <Select onValueChange={(value) => setNewIncident(prev => ({ ...prev, urgency: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High - Immediate attention</SelectItem>
                        <SelectItem value="Medium">Medium - Soon as possible</SelectItem>
                        <SelectItem value="Low">Low - When convenient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority (Auto)</label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">
                      <Badge className={getPriorityColor(calculatePriority(newIncident.impact || 'Medium', newIncident.urgency || 'Medium'))}>
                        {calculatePriority(newIncident.impact || 'Medium', newIncident.urgency || 'Medium')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reported By</label>
                    <Input
                      value={newIncident.reportedBy || ''}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, reportedBy: e.target.value }))}
                      placeholder="Name of reporter"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Affected CI</label>
                    <Input
                      value={newIncident.ciName || ''}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, ciName: e.target.value }))}
                      placeholder="Configuration Item name"
                    />
                  </div>
                </div>

                {/* Templates */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Use Template</label>
                  <div className="flex gap-2 flex-wrap">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => useTemplate(template)}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createIncident}>
                  Create Incident
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
          <TabsTrigger value="intake">Multi-Channel Intake</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="major">Major Incidents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search incidents..."
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
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="P1">P1 - Critical</SelectItem>
                    <SelectItem value="P2">P2 - High</SelectItem>
                    <SelectItem value="P3">P3 - Medium</SelectItem>
                    <SelectItem value="P4">P4 - Low</SelectItem>
                    <SelectItem value="P5">P5 - Planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Incidents List */}
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const slaStatus = getSLAStatus(incident);
              return (
                <Card key={incident.id} className={`${incident.isMajorIncident ? 'border-red-500 border-2' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{incident.id}</h3>
                            {incident.isMajorIncident && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Megaphone className="w-3 h-3" />
                                Major Incident
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{incident.title}</h4>
                          <p className="text-sm text-gray-600">{incident.description}</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Badge className={getPriorityColor(incident.priority)}>
                            {incident.priority}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(incident.reportedVia)}
                          <span>Via: {incident.reportedVia}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Reporter: {incident.reportedBy}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Assigned: {incident.assignedGroup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {incident.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      {incident.ciName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Database className="w-4 h-4" />
                          <span>Affected CI: {incident.ciName}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className={`text-sm font-medium ${slaStatus.color}`}>
                              SLA: {slaStatus.status}
                              {slaStatus.remaining > 0 && ` (${slaStatus.remaining}m remaining)`}
                            </span>
                          </div>
                          {incident.knowledgeArticles.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Lightbulb className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{incident.knowledgeArticles.length} KB articles</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {slaStatus.status === 'At Risk' && (
                            <Button size="sm" variant="destructive" onClick={() => escalateIncident(incident)}>
                              <ArrowUp className="w-4 h-4 mr-1" />
                              Escalate
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)}>
                            View Details
                          </Button>
                        </div>
                      </div>

                      {slaStatus.remaining > 0 && slaStatus.remaining <= incident.slaResponseTime * 0.2 && (
                        <Progress 
                          value={(incident.slaResponseTime - slaStatus.remaining) / incident.slaResponseTime * 100} 
                          className="h-2" 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="intake" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Automatic incident creation from support email addresses.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Monitored Addresses:</strong>
                      <ul className="ml-4 mt-1">
                        <li>• support@company.com</li>
                        <li>• helpdesk@company.com</li>
                        <li>• it-alerts@company.com</li>
                      </ul>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Phone Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Call logging with automatic incident creation and caller ID lookup.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Features:</strong>
                      <ul className="ml-4 mt-1">
                        <li>• Caller ID integration</li>
                        <li>• Call recording links</li>
                        <li>• IVR category selection</li>
                      </ul>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Self-Service Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    User-friendly portal with guided incident submission and knowledge base search.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Features:</strong>
                      <ul className="ml-4 mt-1">
                        <li>• Guided forms</li>
                        <li>• Knowledge base integration</li>
                        <li>• Status tracking</li>
                      </ul>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chatbot Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    AI-powered chatbot for initial triage and incident creation.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Capabilities:</strong>
                      <ul className="ml-4 mt-1">
                        <li>• Natural language processing</li>
                        <li>• Category suggestion</li>
                        <li>• Knowledge base search</li>
                      </ul>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">In Development</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  Monitoring Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Direct integration with monitoring systems for automatic incident creation.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Integrated Systems:</strong>
                      <ul className="ml-4 mt-1">
                        <li>• Nagios</li>
                        <li>• Zabbix</li>
                        <li>• Prometheus</li>
                        <li>• SCOM</li>
                      </ul>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Walk-in Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Quick incident logging for walk-in users with mobile-friendly interface.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Features:</strong>
                      <ul className="ml-4 mt-1">
                        <li>• Quick logging forms</li>
                        <li>• Digital signature</li>
                        <li>• Photo attachments</li>
                      </ul>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.category}</p>
                        <p className="text-sm">{template.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(template.priority)}>
                          {template.priority}
                        </Badge>
                        <Button size="sm" onClick={() => useTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Workflow Steps:</strong>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {template.workflow.map((step, index) => (
                            <Badge key={index} variant="outline">{step}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      {template.knowledgeLinks.length > 0 && (
                        <div className="text-sm">
                          <strong>Related Knowledge:</strong>
                          <div className="flex gap-2 mt-1">
                            {template.knowledgeLinks.map((link, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" />
                                {link}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeBase.map((article) => (
                  <div key={article.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{article.title}</h4>
                        <p className="text-sm text-gray-600">{article.category}</p>
                        <div className="flex gap-2">
                          {article.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>{article.views} views</span>
                          <span>•</span>
                          <span>{article.helpful} helpful</span>
                        </div>
                        <p className="text-gray-400">Updated: {article.lastUpdated.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm">{article.content.substring(0, 150)}...</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          {Math.round((article.helpful / article.views) * 100)}% found helpful
                        </span>
                      </div>
                      <Button size="sm" variant="outline">View Article</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="major" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Major Incident Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Major incidents require special handling with dedicated communication and escalation procedures.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Major Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {incidents.filter(inc => inc.isMajorIncident && inc.status !== 'Closed').map((incident) => (
                        <div key={incident.id} className="border-l-4 border-red-500 pl-4 py-2 mb-4">
                          <h4 className="font-semibold text-red-600">{incident.id}</h4>
                          <p className="font-medium">{incident.title}</p>
                          <p className="text-sm text-gray-600">Status: {incident.status}</p>
                          <p className="text-sm text-gray-600">Assigned: {incident.assignedGroup}</p>
                        </div>
                      ))}
                      {incidents.filter(inc => inc.isMajorIncident && inc.status !== 'Closed').length === 0 && (
                        <p className="text-gray-500 text-center py-8">No active major incidents</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">War Room Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Users className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Multi-team Coordination</p>
                            <p className="text-sm text-gray-600">Assign tasks to multiple teams simultaneously</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Megaphone className="w-5 h-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Broadcast Communications</p>
                            <p className="text-sm text-gray-600">Automated status updates to stakeholders</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Clock className="w-5 h-5 text-red-500" />
                          <div>
                            <p className="font-medium">Accelerated SLA</p>
                            <p className="text-sm text-gray-600">Reduced response and resolution times</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <BarChart3 className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">Real-time Reporting</p>
                            <p className="text-sm text-gray-600">Executive dashboards and status reports</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>MTTR (Mean Time to Resolve)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4.2 hours</div>
                <p className="text-sm text-gray-600">Average resolution time</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>P1 Incidents:</span>
                    <span className="font-medium">2.1 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>P2 Incidents:</span>
                    <span className="font-medium">4.8 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>P3 Incidents:</span>
                    <span className="font-medium">1.2 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">94.2%</div>
                <p className="text-sm text-gray-600">Overall SLA compliance</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response SLA:</span>
                    <span className="font-medium text-green-600">97.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Resolution SLA:</span>
                    <span className="font-medium text-yellow-600">91.3%</span>
                  </div>
                </div>
                <Progress value={94.2} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Recurring Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email connectivity</span>
                    <Badge variant="outline">12 incidents</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network slowness</span>
                    <Badge variant="outline">8 incidents</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">VPN issues</span>
                    <Badge variant="outline">6 incidents</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Application errors</span>
                    <Badge variant="outline">5 incidents</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incident Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">156</div>
                <p className="text-sm text-gray-600">This month</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last month:</span>
                    <span className="font-medium">142</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change:</span>
                    <span className="font-medium text-red-600">+9.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Self-Service</span>
                    </div>
                    <span className="font-medium">32%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <span className="font-medium">18%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      <span className="text-sm">Monitoring</span>
                    </div>
                    <span className="font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">L1-Support</span>
                    <div className="flex items-center gap-2">
                      <Progress value={89} className="w-16 h-2" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">L2-Infrastructure</span>
                    <div className="flex items-center gap-2">
                      <Progress value={94} className="w-16 h-2" />
                      <span className="text-sm font-medium">94%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">L2-Application</span>
                    <div className="flex items-center gap-2">
                      <Progress value={91} className="w-16 h-2" />
                      <span className="text-sm font-medium">91%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
