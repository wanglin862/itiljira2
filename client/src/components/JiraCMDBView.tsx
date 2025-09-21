import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Server,
  Network,
  Shield,
  Ticket,
  AlertTriangle,
  Settings,
  GitBranch,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Link,
  MapPin,
  User,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { getJiraService, JiraTicket, JiraCMDBItem } from '@/services/jiraIntegration';

interface CMDBRelationship {
  ciId: string;
  ciName: string;
  relatedTickets: JiraTicket[];
  dependencies: JiraCMDBItem[];
  dependents: JiraCMDBItem[];
  incidentCount: number;
  problemCount: number;
  changeCount: number;
  lastIncident?: Date;
}

export default function JiraCMDBView() {
  const [cmdbItems, setCmdbItems] = useState<JiraCMDBItem[]>([]);
  const [selectedCI, setSelectedCI] = useState<JiraCMDBItem | null>(null);
  const [ciRelationships, setCiRelationships] = useState<CMDBRelationship | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load CMDB data from localStorage or JIRA
  useEffect(() => {
    loadCMDBData();
  }, []);

  const loadCMDBData = async () => {
    setIsLoading(true);
    try {
      // Try to load from localStorage first
      const localCMDB = localStorage.getItem('jiraCMDBItems');
      if (localCMDB) {
        setCmdbItems(JSON.parse(localCMDB));
      } else {
        // Load from JIRA if no local data
        const jiraService = getJiraService();
        const result = await jiraService.getCMDBItems();
        setCmdbItems(result.issues);
      }
    } catch (error) {
      console.error('Failed to load CMDB data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCIRelationships = async (ci: JiraCMDBItem) => {
    setIsLoading(true);
    try {
      const jiraService = getJiraService();
      
      // Get related tickets
      const relatedTickets = await jiraService.getTicketsForCI(ci.key);
      
      // Get dependencies
      const dependencies = await jiraService.getCIDependencies(ci.key);
      
      // Find dependents (CIs that depend on this CI)
      const allCIs = await jiraService.getCMDBItems();
      const dependents = allCIs.issues.filter(item => 
        item.dependencies.includes(ci.key)
      );

      // Analyze ticket types
      const incidentCount = relatedTickets.filter(t => 
        t.issueType.name.toLowerCase().includes('incident')
      ).length;
      
      const problemCount = relatedTickets.filter(t => 
        t.issueType.name.toLowerCase().includes('problem')
      ).length;
      
      const changeCount = relatedTickets.filter(t => 
        t.issueType.name.toLowerCase().includes('change')
      ).length;

      const lastIncident = relatedTickets
        .filter(t => t.issueType.name.toLowerCase().includes('incident'))
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0];

      const relationships: CMDBRelationship = {
        ciId: ci.id,
        ciName: ci.name,
        relatedTickets,
        dependencies,
        dependents,
        incidentCount,
        problemCount,
        changeCount,
        lastIncident: lastIncident ? new Date(lastIncident.created) : undefined
      };

      setCiRelationships(relationships);
    } catch (error) {
      console.error('Failed to load CI relationships:', error);
    } finally {
      setIsLoading(false);
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

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case 'incident': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'change request': case 'change': return <Settings className="w-4 h-4 text-blue-500" />;
      case 'problem': return <GitBranch className="w-4 h-4 text-yellow-500" />;
      default: return <Ticket className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'operational': return 'bg-green-100 text-green-800';
      case 'inactive': case 'down': return 'bg-red-100 text-red-800';
      case 'maintenance': case 'degraded': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCMDB = cmdbItems.filter(ci => {
    const matchesSearch = ci.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ci.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || ci.ciType.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || ci.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">CMDB & Ticket Relationships</h2>
        <Button onClick={loadCMDBData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CMDB Items List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search CIs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="p-2 border rounded-md text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="server">Server</option>
                      <option value="database">Database</option>
                      <option value="network">Network</option>
                      <option value="application">Application</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="p-2 border rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* CI List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCMDB.map((ci) => (
                    <div
                      key={ci.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCI?.id === ci.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedCI(ci);
                        loadCIRelationships(ci);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCITypeIcon(ci.ciType)}
                          <div>
                            <p className="font-medium text-sm">{ci.key}</p>
                            <p className="text-xs text-gray-600 truncate max-w-32">{ci.name}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(ci.status)} size="sm">
                          {ci.status}
                        </Badge>
                      </div>
                      
                      {ci.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{ci.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CI Details and Relationships */}
        <div className="lg:col-span-2">
          {selectedCI ? (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tickets">Related Tickets</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCITypeIcon(selectedCI.ciType)}
                      {selectedCI.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`${JSON.parse(localStorage.getItem('jiraConfig') || '{}').baseUrl}/browse/${selectedCI.key}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Key:</span>
                              <span className="font-medium">{selectedCI.key}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <Badge variant="outline">{selectedCI.ciType}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <Badge className={getStatusColor(selectedCI.status)}>
                                {selectedCI.status}
                              </Badge>
                            </div>
                            {selectedCI.location && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{selectedCI.location}</span>
                              </div>
                            )}
                            {selectedCI.environment && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Environment:</span>
                                <span className="font-medium">{selectedCI.environment}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedCI.owner && (
                          <div>
                            <h4 className="font-semibold mb-2">Ownership</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Owner:</span>
                                <span className="font-medium">{selectedCI.owner}</span>
                              </div>
                              {selectedCI.supportGroup && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Support Group:</span>
                                  <span className="font-medium">{selectedCI.supportGroup}</span>
                                </div>
                              )}
                              {selectedCI.costCenter && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cost Center:</span>
                                  <span className="font-medium">{selectedCI.costCenter}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {(selectedCI.ipAddress || selectedCI.hostname || selectedCI.operatingSystem) && (
                          <div>
                            <h4 className="font-semibold mb-2">Technical Details</h4>
                            <div className="space-y-2 text-sm">
                              {selectedCI.ipAddress && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">IP Address:</span>
                                  <span className="font-medium font-mono">{selectedCI.ipAddress}</span>
                                </div>
                              )}
                              {selectedCI.hostname && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Hostname:</span>
                                  <span className="font-medium font-mono">{selectedCI.hostname}</span>
                                </div>
                              )}
                              {selectedCI.operatingSystem && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">OS:</span>
                                  <span className="font-medium">{selectedCI.operatingSystem}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {(selectedCI.vendor || selectedCI.model || selectedCI.serialNumber) && (
                          <div>
                            <h4 className="font-semibold mb-2">Hardware Details</h4>
                            <div className="space-y-2 text-sm">
                              {selectedCI.vendor && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Vendor:</span>
                                  <span className="font-medium">{selectedCI.vendor}</span>
                                </div>
                              )}
                              {selectedCI.model && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Model:</span>
                                  <span className="font-medium">{selectedCI.model}</span>
                                </div>
                              )}
                              {selectedCI.serialNumber && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Serial:</span>
                                  <span className="font-medium font-mono">{selectedCI.serialNumber}</span>
                                </div>
                              )}
                              {selectedCI.warrantyExpiry && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Warranty:</span>
                                  <span className="font-medium">{new Date(selectedCI.warrantyExpiry).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Related Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ciRelationships ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{ciRelationships.incidentCount}</div>
                            <div className="text-sm text-gray-600">Incidents</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{ciRelationships.problemCount}</div>
                            <div className="text-sm text-gray-600">Problems</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{ciRelationships.changeCount}</div>
                            <div className="text-sm text-gray-600">Changes</div>
                          </div>
                        </div>

                        {ciRelationships.lastIncident && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Last incident: {ciRelationships.lastIncident.toLocaleDateString()} 
                              ({Math.floor((Date.now() - ciRelationships.lastIncident.getTime()) / (1000 * 60 * 60 * 24))} days ago)
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-3">
                          {ciRelationships.relatedTickets.slice(0, 10).map((ticket) => (
                            <div key={ticket.id} className="border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  {getIssueTypeIcon(ticket.issueType.name)}
                                  <div>
                                    <p className="font-medium">{ticket.key}</p>
                                    <p className="text-sm text-gray-600 line-clamp-1">{ticket.summary}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Badge variant="outline" size="sm">
                                    {ticket.issueType.name}
                                  </Badge>
                                  <Badge className={ticket.status.statusCategory.key === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} size="sm">
                                    {ticket.status.name}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Created: {new Date(ticket.created).toLocaleDateString()}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`${JSON.parse(localStorage.getItem('jiraConfig') || '{}').baseUrl}/browse/${ticket.key}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          {ciRelationships.relatedTickets.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                              <Ticket className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>No related tickets found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>Select a CI to view related tickets</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link className="w-5 h-5" />
                        Dependencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ciRelationships && ciRelationships.dependencies.length > 0 ? (
                        <div className="space-y-2">
                          {ciRelationships.dependencies.map((dep) => (
                            <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {getCITypeIcon(dep.ciType)}
                                <div>
                                  <p className="font-medium text-sm">{dep.key}</p>
                                  <p className="text-xs text-gray-600">{dep.name}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(dep.status)} size="sm">
                                {dep.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No dependencies</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Network className="w-5 h-5" />
                        Dependents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ciRelationships && ciRelationships.dependents.length > 0 ? (
                        <div className="space-y-2">
                          {ciRelationships.dependents.map((dep) => (
                            <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {getCITypeIcon(dep.ciType)}
                                <div>
                                  <p className="font-medium text-sm">{dep.key}</p>
                                  <p className="text-xs text-gray-600">{dep.name}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(dep.status)} size="sm">
                                {dep.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Network className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No dependents</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ciRelationships ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{ciRelationships.dependencies.length}</div>
                            <div className="text-sm text-gray-600">Dependencies</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{ciRelationships.dependents.length}</div>
                            <div className="text-sm text-gray-600">Dependents</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{ciRelationships.relatedTickets.length}</div>
                            <div className="text-sm text-gray-600">Total Tickets</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                              {ciRelationships.relatedTickets.filter(t => 
                                t.status.statusCategory.key !== 'done'
                              ).length}
                            </div>
                            <div className="text-sm text-gray-600">Open Tickets</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Risk Assessment</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="font-medium">High Risk Factors</span>
                              </div>
                              <ul className="text-sm space-y-1">
                                {ciRelationships.incidentCount > 5 && (
                                  <li>• High incident frequency ({ciRelationships.incidentCount})</li>
                                )}
                                {ciRelationships.dependents.length > 3 && (
                                  <li>• Many dependent systems ({ciRelationships.dependents.length})</li>
                                )}
                                {selectedCI.status !== 'Active' && (
                                  <li>• Non-operational status</li>
                                )}
                                {ciRelationships.incidentCount === 0 && ciRelationships.dependents.length <= 3 && selectedCI.status === 'Active' && (
                                  <li className="text-gray-500">• No high risk factors identified</li>
                                )}
                              </ul>
                            </div>

                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">Business Impact</span>
                              </div>
                              <ul className="text-sm space-y-1">
                                {selectedCI.businessService && (
                                  <li>• Affects: {selectedCI.businessService}</li>
                                )}
                                {ciRelationships.dependents.length > 0 && (
                                  <li>• {ciRelationships.dependents.length} dependent services</li>
                                )}
                                <li>• Environment: {selectedCI.environment || 'Unknown'}</li>
                              </ul>
                            </div>

                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="font-medium">Recommendations</span>
                              </div>
                              <ul className="text-sm space-y-1">
                                {ciRelationships.incidentCount > 3 && (
                                  <li>• Consider proactive maintenance</li>
                                )}
                                {ciRelationships.problemCount > 0 && (
                                  <li>• Review open problems</li>
                                )}
                                {!selectedCI.owner && (
                                  <li>• Assign CI owner</li>
                                )}
                                {ciRelationships.incidentCount <= 3 && ciRelationships.problemCount === 0 && selectedCI.owner && (
                                  <li className="text-gray-500">• CI is well maintained</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Loading impact analysis...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500 py-12">
                  <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select a Configuration Item</h3>
                  <p>Choose a CI from the list to view details and relationships</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
