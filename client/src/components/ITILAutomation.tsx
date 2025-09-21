import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Users,
  Link,
  GitBranch,
  CheckCircle,
  Clock,
  Activity,
  Database,
  ArrowUp,
  ArrowRight,
  Settings
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedGroup: string;
  ciId: string;
  ciName: string;
  createdAt: Date;
  slaRemaining: number; // minutes
}

interface Problem {
  id: string;
  title: string;
  status: 'Investigation' | 'RCA Complete' | 'Closed';
  linkedIncidents: string[];
  ciId: string;
  rootCause?: string;
  createdAt: Date;
}

interface Change {
  id: string;
  title: string;
  status: 'Planning' | 'Approval' | 'Implementation' | 'Review' | 'Closed';
  linkedProblem?: string;
  linkedIncidents: string[];
  ciId: string;
  implementationDate?: Date;
}

interface CI {
  id: string;
  name: string;
  type: 'VM' | 'Server' | 'Service' | 'Database' | 'Network';
  location: string;
  status: 'Operational' | 'Degraded' | 'Down' | 'Maintenance';
  dependencies: string[];
}

export default function ITILAutomation() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [cis, setCis] = useState<CI[]>([]);
  const [selectedCI, setSelectedCI] = useState<string>('');
  const [automationStats, setAutomationStats] = useState({
    autoAssigned: 0,
    escalated: 0,
    linkedToProblems: 0,
    changesCreated: 0,
    syncClosed: 0
  });

  // Mock data initialization
  useEffect(() => {
    const mockCIs: CI[] = [
      { id: 'ci-001', name: 'Web Server 01', type: 'Server', location: 'DC-HCM-01', status: 'Operational', dependencies: ['ci-002', 'ci-003'] },
      { id: 'ci-002', name: 'Database Primary', type: 'Database', location: 'DC-HCM-01', status: 'Degraded', dependencies: [] },
      { id: 'ci-003', name: 'Load Balancer', type: 'Network', location: 'DC-HCM-01', status: 'Operational', dependencies: [] },
      { id: 'ci-004', name: 'Payment Service', type: 'Service', location: 'Cloud-AWS', status: 'Down', dependencies: ['ci-002'] }
    ];

    const mockIncidents: Incident[] = [
      { id: 'inc-001', title: 'Database connection timeout', severity: 'Critical', status: 'Open', assignedGroup: 'L1-Support', ciId: 'ci-002', ciName: 'Database Primary', createdAt: new Date(), slaRemaining: 45 },
      { id: 'inc-002', title: 'Payment service unavailable', severity: 'High', status: 'In Progress', assignedGroup: 'L2-Application', ciId: 'ci-004', ciName: 'Payment Service', createdAt: new Date(), slaRemaining: 120 },
      { id: 'inc-003', title: 'Database slow response', severity: 'Medium', status: 'Open', assignedGroup: 'L1-Support', ciId: 'ci-002', ciName: 'Database Primary', createdAt: new Date(), slaRemaining: 240 }
    ];

    const mockProblems: Problem[] = [
      { id: 'prb-001', title: 'Database performance degradation', status: 'Investigation', linkedIncidents: ['inc-001', 'inc-003'], ciId: 'ci-002', createdAt: new Date() }
    ];

    const mockChanges: Change[] = [
      { id: 'chg-001', title: 'Database index optimization', status: 'Planning', linkedProblem: 'prb-001', linkedIncidents: ['inc-001', 'inc-003'], ciId: 'ci-002' }
    ];

    setCis(mockCIs);
    setIncidents(mockIncidents);
    setProblems(mockProblems);
    setChanges(mockChanges);
  }, []);

  // Auto-assign incidents from monitoring
  const autoAssignIncident = (incident: Incident) => {
    const updatedIncident = {
      ...incident,
      assignedGroup: incident.severity === 'Critical' || incident.severity === 'High' ? 'L1-Support' : 'L1-General',
      status: 'In Progress' as const
    };
    
    setIncidents(prev => prev.map(inc => inc.id === incident.id ? updatedIncident : inc));
    setAutomationStats(prev => ({ ...prev, autoAssigned: prev.autoAssigned + 1 }));
  };

  // SLA escalation
  const escalateIncident = (incident: Incident) => {
    let newGroup = incident.assignedGroup;
    if (incident.assignedGroup.includes('L1')) {
      newGroup = incident.severity === 'Critical' ? 'L3-Expert' : 'L2-Advanced';
    } else if (incident.assignedGroup.includes('L2')) {
      newGroup = 'L3-Expert';
    }

    const updatedIncident = { ...incident, assignedGroup: newGroup };
    setIncidents(prev => prev.map(inc => inc.id === incident.id ? updatedIncident : inc));
    setAutomationStats(prev => ({ ...prev, escalated: prev.escalated + 1 }));
  };

  // Link incidents to problem
  const linkIncidentsToProlem = (incidentIds: string[], ciId: string) => {
    const newProblem: Problem = {
      id: `prb-${Date.now()}`,
      title: `Multiple incidents on ${cis.find(ci => ci.id === ciId)?.name}`,
      status: 'Investigation',
      linkedIncidents: incidentIds,
      ciId: ciId,
      createdAt: new Date()
    };

    setProblems(prev => [...prev, newProblem]);
    setAutomationStats(prev => ({ ...prev, linkedToProblems: prev.linkedToProblems + 1 }));
  };

  // Create change from problem
  const createChangeFromProblem = (problem: Problem, rootCause: string) => {
    const newChange: Change = {
      id: `chg-${Date.now()}`,
      title: `Fix for ${problem.title}`,
      status: 'Planning',
      linkedProblem: problem.id,
      linkedIncidents: problem.linkedIncidents,
      ciId: problem.ciId
    };

    const updatedProblem = { ...problem, rootCause, status: 'RCA Complete' as const };
    
    setChanges(prev => [...prev, newChange]);
    setProblems(prev => prev.map(prb => prb.id === problem.id ? updatedProblem : prb));
    setAutomationStats(prev => ({ ...prev, changesCreated: prev.changesCreated + 1 }));
  };

  // Sync close when change completed
  const syncCloseTickets = (change: Change) => {
    const updatedChange = { ...change, status: 'Closed' as const };
    setChanges(prev => prev.map(chg => chg.id === change.id ? updatedChange : chg));

    // Close related incidents and problems
    setIncidents(prev => prev.map(inc => 
      change.linkedIncidents.includes(inc.id) ? { ...inc, status: 'Closed' as const } : inc
    ));

    if (change.linkedProblem) {
      setProblems(prev => prev.map(prb => 
        prb.id === change.linkedProblem ? { ...prb, status: 'Closed' as const } : prb
      ));
    }

    setAutomationStats(prev => ({ ...prev, syncClosed: prev.syncClosed + 1 }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Investigation': return 'bg-yellow-100 text-yellow-800';
      case 'RCA Complete': return 'bg-purple-100 text-purple-800';
      case 'Planning': return 'bg-orange-100 text-orange-800';
      case 'Implementation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ITIL Automation Tools</h1>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Auto-Assigned: {automationStats.autoAssigned}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <ArrowUp className="w-4 h-4" />
            Escalated: {automationStats.escalated}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Link className="w-4 h-4" />
            Linked: {automationStats.linkedToProblems}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="ci-view">CI View</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Incident Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <p className="text-sm text-gray-600">CI: {incident.ciName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Assigned: {incident.assignedGroup}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">SLA: {incident.slaRemaining}m</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {incident.status === 'Open' && (
                          <Button size="sm" onClick={() => autoAssignIncident(incident)}>
                            Auto-Assign
                          </Button>
                        )}
                        {incident.slaRemaining < 60 && incident.status !== 'Closed' && (
                          <Button size="sm" variant="destructive" onClick={() => escalateIncident(incident)}>
                            Escalate
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {incident.slaRemaining < 120 && (
                      <Progress value={(240 - incident.slaRemaining) / 240 * 100} className="h-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Problem Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {problems.map((problem) => (
                  <div key={problem.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{problem.title}</h3>
                        <p className="text-sm text-gray-600">
                          Linked Incidents: {problem.linkedIncidents.length}
                        </p>
                      </div>
                      <Badge className={getStatusColor(problem.status)}>
                        {problem.status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CI: {cis.find(ci => ci.id === problem.ciId)?.name}</span>
                      
                      {problem.status === 'Investigation' && (
                        <Button size="sm" onClick={() => createChangeFromProblem(problem, "Database index fragmentation")}>
                          Create Change
                        </Button>
                      )}
                    </div>
                    
                    {problem.rootCause && (
                      <Alert>
                        <AlertDescription>
                          <strong>Root Cause:</strong> {problem.rootCause}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Change Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {changes.map((change) => (
                  <div key={change.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{change.title}</h3>
                        <p className="text-sm text-gray-600">
                          CI: {cis.find(ci => ci.id === change.ciId)?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(change.status)}>
                        {change.status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        {change.linkedProblem && (
                          <p className="text-sm">Problem: {change.linkedProblem}</p>
                        )}
                        <p className="text-sm">Incidents: {change.linkedIncidents.length}</p>
                      </div>
                      
                      {change.status === 'Implementation' && (
                        <Button size="sm" onClick={() => syncCloseTickets(change)}>
                          Complete & Sync Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ci-view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                CI Relationship & Traceability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Configuration Items</h3>
                  {cis.map((ci) => (
                    <div 
                      key={ci.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedCI === ci.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCI(ci.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{ci.name}</h4>
                          <p className="text-sm text-gray-600">{ci.type} - {ci.location}</p>
                        </div>
                        <Badge className={
                          ci.status === 'Operational' ? 'bg-green-100 text-green-800' :
                          ci.status === 'Degraded' ? 'bg-yellow-100 text-yellow-800' :
                          ci.status === 'Down' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {ci.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCI && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Related Tickets</h3>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-red-600">Incidents</h4>
                      {incidents.filter(inc => inc.ciId === selectedCI).map((incident) => (
                        <div key={incident.id} className="border-l-4 border-red-500 pl-3 py-2">
                          <p className="font-medium">{incident.title}</p>
                          <p className="text-sm text-gray-600">{incident.status} - {incident.assignedGroup}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-yellow-600">Problems</h4>
                      {problems.filter(prb => prb.ciId === selectedCI).map((problem) => (
                        <div key={problem.id} className="border-l-4 border-yellow-500 pl-3 py-2">
                          <p className="font-medium">{problem.title}</p>
                          <p className="text-sm text-gray-600">{problem.status}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-600">Changes</h4>
                      {changes.filter(chg => chg.ciId === selectedCI).map((change) => (
                        <div key={change.id} className="border-l-4 border-blue-500 pl-3 py-2">
                          <p className="font-medium">{change.title}</p>
                          <p className="text-sm text-gray-600">{change.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Auto-Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Monitoring alerts automatically assigned to L1 support teams based on severity.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Critical/High → L1-Support</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Medium/Low → L1-General</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5" />
                  SLA Escalation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Automatic escalation when SLA thresholds are breached.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">L1 → L2/L3</span>
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Critical → L3 Direct</span>
                    <ArrowRight className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Problem Linking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Multiple incidents on same CI automatically linked to Problem record.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => linkIncidentsToProlem(['inc-001', 'inc-003'], 'ci-002')}
                  className="w-full"
                >
                  Link Similar Incidents
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Change Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  After RCA, analysts can create Change tickets directly from Problem records.
                </p>
                <div className="text-sm space-y-1">
                  <p>✓ Auto-link to Problem</p>
                  <p>✓ Inherit CI relationships</p>
                  <p>✓ Link related Incidents</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Sync Closure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  When Change is completed, all related Incidents and Problems are closed automatically.
                </p>
                <div className="text-sm space-y-1">
                  <p>✓ Close linked Incidents</p>
                  <p>✓ Close parent Problem</p>
                  <p>✓ Update CI status</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  CI Traceability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  From any ticket, instantly view VM/Server/Location and all related tickets.
                </p>
                <div className="text-sm space-y-1">
                  <p>✓ CI → All tickets</p>
                  <p>✓ Ticket → CI details</p>
                  <p>✓ Dependency mapping</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

