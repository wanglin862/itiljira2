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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Settings,
  Calendar as CalendarIcon,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Database,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3,
  Workflow,
  Shield,
  Zap,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  GitBranch
} from 'lucide-react';
import { format } from 'date-fns';

interface Change {
  id: string;
  title: string;
  description: string;
  type: 'Standard' | 'Normal' | 'Emergency';
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Planning' | 'Approval' | 'Approved' | 'Implementation' | 'Review' | 'Closed' | 'Cancelled';
  riskLevel: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  requestedBy: string;
  assignedTo: string;
  assignedGroup: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  implementationPlan: string;
  backoutPlan: string;
  testPlan: string;
  affectedCIs: string[];
  linkedIncidents: string[];
  linkedProblems: string[];
  linkedReleases: string[];
  approvers: ChangeApprover[];
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  cabRequired: boolean;
  cabDate?: Date;
  blackoutPeriod: boolean;
  downtime: number; // minutes
  businessJustification: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChangeApprover {
  id: string;
  name: string;
  role: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comments?: string;
  approvedAt?: Date;
}

interface ChangeTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  implementationPlan: string;
  backoutPlan: string;
  testPlan: string;
  estimatedDowntime: number;
  riskLevel: string;
  requiredApprovers: string[];
  workflow: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedRole: string;
  estimatedDuration: number;
  dependencies: string[];
  mandatory: boolean;
}

interface BlackoutPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  affectedServices: string[];
}

export default function ChangeManagement() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [templates, setTemplates] = useState<ChangeTemplate[]>([]);
  const [blackoutPeriods, setBlackoutPeriods] = useState<BlackoutPeriod[]>([]);
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);
  const [newChange, setNewChange] = useState<Partial<Change>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isWorkflowDesignerOpen, setIsWorkflowDesignerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Mock data initialization
  useEffect(() => {
    const mockChanges: Change[] = [
      {
        id: 'CHG-001',
        title: 'Database Index Optimization - Production',
        description: 'Optimize database indexes to improve query performance and resolve slow response times.',
        type: 'Normal',
        category: 'Database',
        priority: 'High',
        status: 'Approval',
        riskLevel: 'Medium',
        impact: 'Medium',
        requestedBy: 'John Smith',
        assignedTo: 'Database Team',
        assignedGroup: 'DBA-Team',
        plannedStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        plannedEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        implementationPlan: 'Rebuild indexes during maintenance window, monitor performance',
        backoutPlan: 'Restore from backup if performance degrades',
        testPlan: 'Performance testing before and after implementation',
        affectedCIs: ['ci-002', 'ci-004'],
        linkedIncidents: ['INC-001', 'INC-003'],
        linkedProblems: ['PRB-001'],
        linkedReleases: [],
        approvers: [
          { id: 'app-001', name: 'Mike Wilson', role: 'DBA Lead', status: 'Approved', approvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { id: 'app-002', name: 'Sarah Johnson', role: 'IT Manager', status: 'Pending' },
          { id: 'app-003', name: 'David Brown', role: 'Business Owner', status: 'Pending' }
        ],
        approvalStatus: 'Pending',
        cabRequired: true,
        cabDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        blackoutPeriod: false,
        downtime: 30,
        businessJustification: 'Critical performance issues affecting user experience',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'CHG-002',
        title: 'Security Patch Deployment - Web Servers',
        description: 'Deploy critical security patches to all production web servers.',
        type: 'Standard',
        category: 'Security',
        priority: 'Critical',
        status: 'Implementation',
        riskLevel: 'Low',
        impact: 'Low',
        requestedBy: 'Security Team',
        assignedTo: 'Infrastructure Team',
        assignedGroup: 'L2-Infrastructure',
        plannedStart: new Date(Date.now() - 2 * 60 * 60 * 1000),
        plannedEnd: new Date(Date.now() + 1 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 2 * 60 * 60 * 1000),
        implementationPlan: 'Rolling deployment across web server cluster',
        backoutPlan: 'Rollback to previous patch level if issues occur',
        testPlan: 'Automated testing and health checks',
        affectedCIs: ['ci-001', 'ci-007', 'ci-008'],
        linkedIncidents: [],
        linkedProblems: [],
        linkedReleases: [],
        approvers: [
          { id: 'app-004', name: 'Security Manager', role: 'Security Lead', status: 'Approved', approvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
        ],
        approvalStatus: 'Approved',
        cabRequired: false,
        blackoutPeriod: false,
        downtime: 0,
        businessJustification: 'Critical security vulnerability remediation',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'CHG-003',
        title: 'Emergency Network Switch Replacement',
        description: 'Replace failed network switch in Building A to restore connectivity.',
        type: 'Emergency',
        category: 'Network',
        priority: 'Critical',
        status: 'Closed',
        riskLevel: 'High',
        impact: 'High',
        requestedBy: 'Network Operations',
        assignedTo: 'Network Team',
        assignedGroup: 'L2-Network',
        plannedStart: new Date(Date.now() - 6 * 60 * 60 * 1000),
        plannedEnd: new Date(Date.now() - 4 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 6 * 60 * 60 * 1000),
        actualEnd: new Date(Date.now() - 4 * 60 * 60 * 1000),
        implementationPlan: 'Replace switch hardware and restore configuration',
        backoutPlan: 'Revert to backup switch if new hardware fails',
        testPlan: 'Connectivity testing for all affected users',
        affectedCIs: ['ci-006'],
        linkedIncidents: ['INC-002'],
        linkedProblems: [],
        linkedReleases: [],
        approvers: [
          { id: 'app-005', name: 'Emergency Approver', role: 'IT Director', status: 'Approved', approvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) }
        ],
        approvalStatus: 'Approved',
        cabRequired: false,
        blackoutPeriod: false,
        downtime: 120,
        businessJustification: 'Emergency repair to restore critical network connectivity',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ];

    const mockTemplates: ChangeTemplate[] = [
      {
        id: 'TPL-CHG-001',
        name: 'Database Maintenance',
        type: 'Standard',
        category: 'Database',
        description: 'Standard database maintenance procedures',
        implementationPlan: '1. Take backup\n2. Apply maintenance\n3. Verify integrity\n4. Monitor performance',
        backoutPlan: 'Restore from backup if issues occur',
        testPlan: 'Performance and functionality testing',
        estimatedDowntime: 30,
        riskLevel: 'Low',
        requiredApprovers: ['DBA Lead', 'IT Manager'],
        workflow: [
          { id: 'step-1', name: 'Planning', description: 'Plan maintenance activities', assignedRole: 'DBA', estimatedDuration: 60, dependencies: [], mandatory: true },
          { id: 'step-2', name: 'Backup', description: 'Create full backup', assignedRole: 'DBA', estimatedDuration: 30, dependencies: ['step-1'], mandatory: true },
          { id: 'step-3', name: 'Maintenance', description: 'Perform maintenance', assignedRole: 'DBA', estimatedDuration: 120, dependencies: ['step-2'], mandatory: true },
          { id: 'step-4', name: 'Testing', description: 'Verify functionality', assignedRole: 'QA', estimatedDuration: 30, dependencies: ['step-3'], mandatory: true }
        ]
      },
      {
        id: 'TPL-CHG-002',
        name: 'Security Patch',
        type: 'Standard',
        category: 'Security',
        description: 'Standard security patch deployment',
        implementationPlan: '1. Test in staging\n2. Rolling deployment\n3. Verify security\n4. Monitor systems',
        backoutPlan: 'Rollback to previous version',
        testPlan: 'Security and functionality testing',
        estimatedDowntime: 0,
        riskLevel: 'Low',
        requiredApprovers: ['Security Lead'],
        workflow: [
          { id: 'step-1', name: 'Staging Test', description: 'Test in staging environment', assignedRole: 'Security', estimatedDuration: 60, dependencies: [], mandatory: true },
          { id: 'step-2', name: 'Production Deploy', description: 'Deploy to production', assignedRole: 'Infrastructure', estimatedDuration: 90, dependencies: ['step-1'], mandatory: true },
          { id: 'step-3', name: 'Verification', description: 'Verify patch installation', assignedRole: 'Security', estimatedDuration: 30, dependencies: ['step-2'], mandatory: true }
        ]
      }
    ];

    const mockBlackoutPeriods: BlackoutPeriod[] = [
      {
        id: 'BO-001',
        name: 'Year-End Financial Close',
        startDate: new Date('2025-12-28'),
        endDate: new Date('2026-01-05'),
        reason: 'Financial year-end processing - no changes allowed',
        affectedServices: ['Financial Systems', 'Reporting', 'Database']
      },
      {
        id: 'BO-002',
        name: 'Black Friday Weekend',
        startDate: new Date('2025-11-29'),
        endDate: new Date('2025-12-02'),
        reason: 'High traffic period - change freeze',
        affectedServices: ['E-commerce', 'Payment Systems', 'Web Servers']
      }
    ];

    setChanges(mockChanges);
    setTemplates(mockTemplates);
    setBlackoutPeriods(mockBlackoutPeriods);
  }, []);

  const createChange = () => {
    if (!newChange.title || !newChange.type) return;

    const change: Change = {
      id: `CHG-${String(changes.length + 1).padStart(3, '0')}`,
      title: newChange.title,
      description: newChange.description || '',
      type: newChange.type as any,
      category: newChange.category || 'General',
      priority: (newChange.priority || 'Medium') as any,
      status: 'Draft',
      riskLevel: (newChange.riskLevel || 'Medium') as any,
      impact: (newChange.impact || 'Medium') as any,
      requestedBy: newChange.requestedBy || 'Current User',
      assignedTo: newChange.assignedTo || '',
      assignedGroup: newChange.assignedGroup || 'Change Team',
      plannedStart: newChange.plannedStart || new Date(Date.now() + 24 * 60 * 60 * 1000),
      plannedEnd: newChange.plannedEnd || new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      implementationPlan: newChange.implementationPlan || '',
      backoutPlan: newChange.backoutPlan || '',
      testPlan: newChange.testPlan || '',
      affectedCIs: newChange.affectedCIs || [],
      linkedIncidents: newChange.linkedIncidents || [],
      linkedProblems: newChange.linkedProblems || [],
      linkedReleases: newChange.linkedReleases || [],
      approvers: [],
      approvalStatus: 'Pending',
      cabRequired: newChange.cabRequired || false,
      blackoutPeriod: false,
      downtime: newChange.downtime || 0,
      businessJustification: newChange.businessJustification || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChanges(prev => [change, ...prev]);
    setNewChange({});
    setIsCreateDialogOpen(false);
  };

  const useTemplate = (template: ChangeTemplate) => {
    setNewChange({
      type: template.type as any,
      category: template.category,
      description: template.description,
      implementationPlan: template.implementationPlan,
      backoutPlan: template.backoutPlan,
      testPlan: template.testPlan,
      riskLevel: template.riskLevel as any,
      downtime: template.estimatedDowntime
    });
  };

  const approveChange = (changeId: string, approverId: string, approved: boolean, comments?: string) => {
    setChanges(prev => prev.map(change => {
      if (change.id === changeId) {
        const updatedApprovers = change.approvers.map(approver => {
          if (approver.id === approverId) {
            return {
              ...approver,
              status: approved ? 'Approved' as const : 'Rejected' as const,
              comments,
              approvedAt: new Date()
            };
          }
          return approver;
        });

        const allApproved = updatedApprovers.every(app => app.status === 'Approved');
        const anyRejected = updatedApprovers.some(app => app.status === 'Rejected');

        return {
          ...change,
          approvers: updatedApprovers,
          approvalStatus: anyRejected ? 'Rejected' : allApproved ? 'Approved' : 'Pending',
          status: anyRejected ? 'Cancelled' : allApproved ? 'Approved' : change.status,
          updatedAt: new Date()
        };
      }
      return change;
    }));
  };

  const checkBlackoutConflict = (startDate: Date, endDate: Date): BlackoutPeriod | null => {
    return blackoutPeriods.find(period => 
      (startDate >= period.startDate && startDate <= period.endDate) ||
      (endDate >= period.startDate && endDate <= period.endDate) ||
      (startDate <= period.startDate && endDate >= period.endDate)
    ) || null;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Emergency': return 'bg-red-500';
      case 'Normal': return 'bg-blue-500';
      case 'Standard': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Planning': return 'bg-blue-100 text-blue-800';
      case 'Approval': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Implementation': return 'bg-orange-100 text-orange-800';
      case 'Review': return 'bg-purple-100 text-purple-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredChanges = changes.filter(change => {
    const matchesSearch = change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         change.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || change.status === filterStatus;
    const matchesType = filterType === 'all' || change.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Change Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsWorkflowDesignerOpen(true)}>
            <Workflow className="w-4 h-4 mr-2" />
            Workflow Designer
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Change
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Change Request</DialogTitle>
                <DialogDescription>
                  Create a new change request following ITIL 4 standards.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        value={newChange.title || ''}
                        onChange={(e) => setNewChange(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Brief description of the change"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Change Type *</label>
                      <Select onValueChange={(value) => setNewChange(prev => ({ ...prev, type: value as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard - Pre-approved, low risk</SelectItem>
                          <SelectItem value="Normal">Normal - Requires CAB approval</SelectItem>
                          <SelectItem value="Emergency">Emergency - Urgent, post-implementation review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newChange.description || ''}
                      onChange={(e) => setNewChange(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the change"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select onValueChange={(value) => setNewChange(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Database">Database</SelectItem>
                          <SelectItem value="Network">Network</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Application">Application</SelectItem>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="Hardware">Hardware</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select onValueChange={(value) => setNewChange(prev => ({ ...prev, priority: value as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Risk Level</label>
                      <Select onValueChange={(value) => setNewChange(prev => ({ ...prev, riskLevel: value as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Scheduling</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Planned Start</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newChange.plannedStart ? format(newChange.plannedStart, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newChange.plannedStart}
                            onSelect={(date) => setNewChange(prev => ({ ...prev, plannedStart: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Planned End</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newChange.plannedEnd ? format(newChange.plannedEnd, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newChange.plannedEnd}
                            onSelect={(date) => setNewChange(prev => ({ ...prev, plannedEnd: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expected Downtime (minutes)</label>
                      <Input
                        type="number"
                        value={newChange.downtime || 0}
                        onChange={(e) => setNewChange(prev => ({ ...prev, downtime: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CAB Required</label>
                      <Select onValueChange={(value) => setNewChange(prev => ({ ...prev, cabRequired: value === 'true' }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes - Requires CAB approval</SelectItem>
                          <SelectItem value="false">No - Standard change</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Implementation Plans */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Implementation Plans</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Implementation Plan</label>
                      <Textarea
                        value={newChange.implementationPlan || ''}
                        onChange={(e) => setNewChange(prev => ({ ...prev, implementationPlan: e.target.value }))}
                        placeholder="Detailed steps for implementation"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Backout Plan</label>
                      <Textarea
                        value={newChange.backoutPlan || ''}
                        onChange={(e) => setNewChange(prev => ({ ...prev, backoutPlan: e.target.value }))}
                        placeholder="Steps to rollback if change fails"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Test Plan</label>
                      <Textarea
                        value={newChange.testPlan || ''}
                        onChange={(e) => setNewChange(prev => ({ ...prev, testPlan: e.target.value }))}
                        placeholder="Testing procedures to verify success"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Justification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Justification</h3>
                  <Textarea
                    value={newChange.businessJustification || ''}
                    onChange={(e) => setNewChange(prev => ({ ...prev, businessJustification: e.target.value }))}
                    placeholder="Business reason and benefits for this change"
                    rows={3}
                  />
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
                <Button onClick={createChange}>
                  Create Change Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="changes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="changes">Active Changes</TabsTrigger>
          <TabsTrigger value="calendar">Change Calendar</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="cab">CAB Management</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search changes..."
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
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Approval">Approval</SelectItem>
                    <SelectItem value="Implementation">Implementation</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Changes List */}
          <div className="space-y-4">
            {filteredChanges.map((change) => {
              const blackoutConflict = checkBlackoutConflict(change.plannedStart, change.plannedEnd);
              return (
                <Card key={change.id} className={`${blackoutConflict ? 'border-red-500 border-2' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{change.id}</h3>
                            {change.type === 'Emergency' && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Emergency
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{change.title}</h4>
                          <p className="text-sm text-gray-600">{change.description}</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Badge className={getTypeColor(change.type)}>
                            {change.type}
                          </Badge>
                          <Badge className={getStatusColor(change.status)}>
                            {change.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Assigned: {change.assignedGroup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${getRiskColor(change.riskLevel)}`} />
                          <span>Risk: {change.riskLevel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Start: {change.plannedStart.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Downtime: {change.downtime}m</span>
                        </div>
                      </div>

                      {/* Approval Status */}
                      {change.approvers.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Approvals:</h5>
                          <div className="flex gap-2 flex-wrap">
                            {change.approvers.map((approver) => (
                              <div key={approver.id} className="flex items-center gap-2 p-2 border rounded">
                                <span className="text-sm">{approver.name}</span>
                                {approver.status === 'Approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {approver.status === 'Rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                                {approver.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Items */}
                      <div className="flex gap-4 text-sm">
                        {change.linkedIncidents.length > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span>{change.linkedIncidents.length} incidents</span>
                          </div>
                        )}
                        {change.linkedProblems.length > 0 && (
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4 text-yellow-500" />
                            <span>{change.linkedProblems.length} problems</span>
                          </div>
                        )}
                        {change.affectedCIs.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Database className="w-4 h-4 text-blue-500" />
                            <span>{change.affectedCIs.length} CIs affected</span>
                          </div>
                        )}
                      </div>

                      {/* Blackout Warning */}
                      {blackoutConflict && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Blackout Period Conflict:</strong> This change conflicts with "{blackoutConflict.name}" 
                            ({blackoutConflict.startDate.toLocaleDateString()} - {blackoutConflict.endDate.toLocaleDateString()})
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Created: {change.createdAt.toLocaleDateString()} | 
                          Updated: {change.updatedAt.toLocaleDateString()}
                        </div>
                        
                        <div className="flex gap-2">
                          {change.status === 'Approval' && change.approvers.some(app => app.status === 'Pending') && (
                            <Button size="sm" variant="outline">
                              Review Approvals
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setSelectedChange(change)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Change Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  
                  {selectedDate && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold">Changes on {format(selectedDate, "PPP")}</h4>
                      {changes.filter(change => 
                        change.plannedStart.toDateString() === selectedDate.toDateString()
                      ).map((change) => (
                        <div key={change.id} className="p-2 border rounded flex justify-between items-center">
                          <div>
                            <p className="font-medium">{change.id} - {change.title}</p>
                            <p className="text-sm text-gray-600">{change.assignedGroup}</p>
                          </div>
                          <Badge className={getTypeColor(change.type)}>
                            {change.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blackout Periods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {blackoutPeriods.map((period) => (
                      <div key={period.id} className="p-3 border-l-4 border-red-500 bg-red-50">
                        <h4 className="font-semibold text-red-800">{period.name}</h4>
                        <p className="text-sm text-red-600">
                          {period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-red-500 mt-1">{period.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {changes.filter(change => 
                      change.plannedStart > new Date() && 
                      change.status !== 'Cancelled' && 
                      change.status !== 'Closed'
                    ).slice(0, 5).map((change) => (
                      <div key={change.id} className="p-2 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{change.id}</p>
                            <p className="text-xs text-gray-600">{change.plannedStart.toLocaleDateString()}</p>
                          </div>
                          <Badge className={getTypeColor(change.type)} size="sm">
                            {change.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.category} - {template.type}</p>
                        <p className="text-sm">{template.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getRiskColor(template.riskLevel)}>
                          {template.riskLevel} Risk
                        </Badge>
                        <Button size="sm" onClick={() => useTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Estimated Downtime:</strong> {template.estimatedDowntime} minutes
                      </div>
                      <div>
                        <strong>Workflow Steps:</strong> {template.workflow.length}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Required Approvers:</strong>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {template.requiredApprovers.map((approver, index) => (
                            <Badge key={index} variant="outline">{approver}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cab" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Change Advisory Board (CAB)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      CAB meetings are held every Tuesday at 2:00 PM for Normal changes requiring approval.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-medium">CAB Members:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-sm text-gray-600">IT Manager - Chair</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">Mike Wilson</p>
                          <p className="text-sm text-gray-600">Infrastructure Lead</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">David Brown</p>
                          <p className="text-sm text-gray-600">Business Representative</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">Lisa Chen</p>
                          <p className="text-sm text-gray-600">Security Lead</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending CAB Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {changes.filter(change => 
                    change.cabRequired && 
                    change.status === 'Approval' && 
                    change.approvalStatus === 'Pending'
                  ).map((change) => (
                    <div key={change.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{change.id}</h4>
                          <p className="text-sm">{change.title}</p>
                          <p className="text-xs text-gray-600">
                            Scheduled: {change.plannedStart.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getTypeColor(change.type)}>
                          {change.type}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Risk: <span className={getRiskColor(change.riskLevel)}>{change.riskLevel}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {changes.filter(change => 
                    change.cabRequired && 
                    change.status === 'Approval' && 
                    change.approvalStatus === 'Pending'
                  ).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No pending CAB approvals</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Workflow Designer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Design custom workflows for different types of changes. Drag and drop workflow steps to create your process.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Available Workflow Steps</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 border rounded-lg cursor-move hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Planning</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Plan the change</p>
                      </div>
                      <div className="p-3 border rounded-lg cursor-move hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">Approval</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Get approvals</p>
                      </div>
                      <div className="p-3 border rounded-lg cursor-move hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">Implementation</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Execute change</p>
                      </div>
                      <div className="p-3 border rounded-lg cursor-move hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">Testing</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Verify success</p>
                      </div>
                      <div className="p-3 border rounded-lg cursor-move hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Review</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Post-implementation review</p>
                      </div>
                      <div className="p-3 border rounded-lg cursor-move hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Closure</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Close the change</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Workflow Canvas</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Workflow className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Drag workflow steps here to build your process</p>
                        <p className="text-sm mt-1">Connect steps with arrows to define the flow</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>Save Workflow</Button>
                  <Button variant="outline">Load Template</Button>
                  <Button variant="outline">Reset</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">87.5%</div>
                <p className="text-sm text-gray-600">Successful changes this month</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Standard:</span>
                    <span className="font-medium text-green-600">98.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Normal:</span>
                    <span className="font-medium text-green-600">85.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Emergency:</span>
                    <span className="font-medium text-yellow-600">72.3%</span>
                  </div>
                </div>
                <Progress value={87.5} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Backlog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24</div>
                <p className="text-sm text-gray-600">Changes in backlog</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Planning:</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Approval:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Implementation:</span>
                    <span className="font-medium">4</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">3</div>
                <p className="text-sm text-gray-600">This month</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last month:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change:</span>
                    <span className="font-medium text-green-600">-40%</span>
                  </div>
                </div>
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Target: &lt;5% of total changes
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Lead Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5.2 days</div>
                <p className="text-sm text-gray-600">From request to implementation</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Standard:</span>
                    <span className="font-medium">1.5 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Normal:</span>
                    <span className="font-medium">8.3 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Emergency:</span>
                    <span className="font-medium">0.5 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CAB Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">92%</div>
                <p className="text-sm text-gray-600">Changes approved on first review</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Approved:</span>
                    <span className="font-medium text-green-600">28</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rejected:</span>
                    <span className="font-medium text-red-600">2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Deferred:</span>
                    <span className="font-medium text-yellow-600">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Low Risk</span>
                    </div>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Medium Risk</span>
                    </div>
                    <span className="font-medium">28%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">High Risk</span>
                    </div>
                    <span className="font-medium">7%</span>
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
