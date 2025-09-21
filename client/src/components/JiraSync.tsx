import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Database,
  Ticket,
  Activity,
  Zap
} from 'lucide-react';
import { getJiraService, JiraTicket, JiraCMDBItem } from '@/services/jiraIntegration';

interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  totalItems: number;
  processedItems: number;
  errors: string[];
  lastSync: Date | null;
}

interface SyncResult {
  success: boolean;
  ticketsProcessed: number;
  cmdbItemsProcessed: number;
  errors: string[];
  duration: number;
}

export default function JiraSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    totalItems: 0,
    processedItems: 0,
    errors: [],
    lastSync: null
  });

  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(30); // minutes

  // Load sync history from localStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('jiraSyncResults');
    if (savedResults) {
      try {
        setSyncResults(JSON.parse(savedResults));
      } catch (error) {
        console.error('Failed to load sync results:', error);
      }
    }

    const lastSync = localStorage.getItem('jiraLastSync');
    if (lastSync) {
      setSyncStatus(prev => ({ ...prev, lastSync: new Date(lastSync) }));
    }

    const autoSync = localStorage.getItem('jiraAutoSync');
    if (autoSync === 'true') {
      setAutoSyncEnabled(true);
    }
  }, []);

  // Auto sync interval
  useEffect(() => {
    if (autoSyncEnabled && !syncStatus.isRunning) {
      const interval = setInterval(() => {
        performFullSync();
      }, syncInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoSyncEnabled, syncInterval, syncStatus.isRunning]);

  const updateSyncStatus = (updates: Partial<SyncStatus>) => {
    setSyncStatus(prev => ({ ...prev, ...updates }));
  };

  const addSyncResult = (result: SyncResult) => {
    const newResults = [result, ...syncResults.slice(0, 9)]; // Keep last 10 results
    setSyncResults(newResults);
    localStorage.setItem('jiraSyncResults', JSON.stringify(newResults));
    localStorage.setItem('jiraLastSync', new Date().toISOString());
  };

  const performFullSync = async () => {
    const startTime = Date.now();
    let ticketsProcessed = 0;
    let cmdbItemsProcessed = 0;
    const errors: string[] = [];

    try {
      updateSyncStatus({
        isRunning: true,
        progress: 0,
        currentStep: 'Initializing sync...',
        processedItems: 0,
        errors: []
      });

      const jiraService = getJiraService();

      // Step 1: Sync Tickets
      updateSyncStatus({
        progress: 10,
        currentStep: 'Fetching tickets from JIRA...'
      });

      try {
        let startAt = 0;
        const maxResults = 50;
        let totalTickets = 0;

        // Get total count first
        const initialResult = await jiraService.getTickets('', 0, 1);
        totalTickets = initialResult.total;

        updateSyncStatus({
          totalItems: totalTickets,
          currentStep: `Syncing ${totalTickets} tickets...`
        });

        while (startAt < totalTickets) {
          const ticketsResult = await jiraService.getTickets('', startAt, maxResults);
          
          // Process tickets (save to local storage or database)
          for (const ticket of ticketsResult.issues) {
            await processTicket(ticket);
            ticketsProcessed++;
            
            updateSyncStatus({
              processedItems: ticketsProcessed,
              progress: Math.floor((ticketsProcessed / totalTickets) * 40) + 10
            });
          }

          startAt += maxResults;
        }
      } catch (error) {
        errors.push(`Ticket sync error: ${error}`);
      }

      // Step 2: Sync CMDB Items
      updateSyncStatus({
        progress: 50,
        currentStep: 'Fetching CMDB items from JIRA...'
      });

      try {
        let startAt = 0;
        const maxResults = 50;
        let totalCMDB = 0;

        // Get total count first
        const initialCMDBResult = await jiraService.getCMDBItems('', 0, 1);
        totalCMDB = initialCMDBResult.total;

        updateSyncStatus({
          currentStep: `Syncing ${totalCMDB} CMDB items...`
        });

        while (startAt < totalCMDB) {
          const cmdbResult = await jiraService.getCMDBItems('', startAt, maxResults);
          
          // Process CMDB items
          for (const ci of cmdbResult.issues) {
            await processCMDBItem(ci);
            cmdbItemsProcessed++;
            
            updateSyncStatus({
              progress: Math.floor((cmdbItemsProcessed / totalCMDB) * 40) + 50
            });
          }

          startAt += maxResults;
        }
      } catch (error) {
        errors.push(`CMDB sync error: ${error}`);
      }

      // Step 3: Update relationships
      updateSyncStatus({
        progress: 90,
        currentStep: 'Updating relationships...'
      });

      await updateTicketCIRelationships();

      // Step 4: Complete
      updateSyncStatus({
        progress: 100,
        currentStep: 'Sync completed!'
      });

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: errors.length === 0,
        ticketsProcessed,
        cmdbItemsProcessed,
        errors,
        duration
      };

      addSyncResult(result);

      setTimeout(() => {
        updateSyncStatus({
          isRunning: false,
          progress: 0,
          currentStep: '',
          lastSync: new Date()
        });
      }, 2000);

    } catch (error) {
      errors.push(`Sync failed: ${error}`);
      
      const result: SyncResult = {
        success: false,
        ticketsProcessed,
        cmdbItemsProcessed,
        errors,
        duration: Date.now() - startTime
      };

      addSyncResult(result);

      updateSyncStatus({
        isRunning: false,
        progress: 0,
        currentStep: 'Sync failed',
        errors
      });
    }
  };

  const processTicket = async (ticket: JiraTicket): Promise<void> => {
    // Save ticket to localStorage or send to backend
    const existingTickets = JSON.parse(localStorage.getItem('jiraTickets') || '[]');
    const ticketIndex = existingTickets.findIndex((t: JiraTicket) => t.id === ticket.id);
    
    if (ticketIndex >= 0) {
      existingTickets[ticketIndex] = ticket;
    } else {
      existingTickets.push(ticket);
    }
    
    localStorage.setItem('jiraTickets', JSON.stringify(existingTickets));
  };

  const processCMDBItem = async (ci: JiraCMDBItem): Promise<void> => {
    // Save CMDB item to localStorage or send to backend
    const existingCIs = JSON.parse(localStorage.getItem('jiraCMDBItems') || '[]');
    const ciIndex = existingCIs.findIndex((c: JiraCMDBItem) => c.id === ci.id);
    
    if (ciIndex >= 0) {
      existingCIs[ciIndex] = ci;
    } else {
      existingCIs.push(ci);
    }
    
    localStorage.setItem('jiraCMDBItems', JSON.stringify(existingCIs));
  };

  const updateTicketCIRelationships = async (): Promise<void> => {
    // Update relationships between tickets and CIs
    const tickets = JSON.parse(localStorage.getItem('jiraTickets') || '[]');
    const cis = JSON.parse(localStorage.getItem('jiraCMDBItems') || '[]');

    for (const ticket of tickets) {
      if (ticket.affectedCI && ticket.affectedCI.length > 0) {
        // Update CI with related tickets
        for (const ciKey of ticket.affectedCI) {
          const ci = cis.find((c: JiraCMDBItem) => c.key === ciKey);
          if (ci) {
            if (!ci.relatedTickets) {
              ci.relatedTickets = [];
            }
            if (!ci.relatedTickets.includes(ticket.key)) {
              ci.relatedTickets.push(ticket.key);
            }
          }
        }
      }
    }

    localStorage.setItem('jiraCMDBItems', JSON.stringify(cis));
  };

  const performIncrementalSync = async () => {
    if (!syncStatus.lastSync) {
      await performFullSync();
      return;
    }

    const startTime = Date.now();
    let ticketsProcessed = 0;
    let cmdbItemsProcessed = 0;
    const errors: string[] = [];

    try {
      updateSyncStatus({
        isRunning: true,
        progress: 0,
        currentStep: 'Performing incremental sync...'
      });

      const jiraService = getJiraService();
      const lastSyncDate = syncStatus.lastSync.toISOString().split('T')[0];

      // Sync only updated tickets
      const jql = `updated >= "${lastSyncDate}" ORDER BY updated DESC`;
      const ticketsResult = await jiraService.getTickets(jql, 0, 100);
      
      updateSyncStatus({
        totalItems: ticketsResult.issues.length,
        currentStep: `Syncing ${ticketsResult.issues.length} updated tickets...`
      });

      for (const ticket of ticketsResult.issues) {
        await processTicket(ticket);
        ticketsProcessed++;
        
        updateSyncStatus({
          processedItems: ticketsProcessed,
          progress: Math.floor((ticketsProcessed / ticketsResult.issues.length) * 100)
        });
      }

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: true,
        ticketsProcessed,
        cmdbItemsProcessed,
        errors,
        duration
      };

      addSyncResult(result);

      updateSyncStatus({
        isRunning: false,
        progress: 0,
        currentStep: '',
        lastSync: new Date()
      });

    } catch (error) {
      errors.push(`Incremental sync failed: ${error}`);
      
      updateSyncStatus({
        isRunning: false,
        progress: 0,
        currentStep: 'Incremental sync failed',
        errors
      });
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('jiraAutoSync', newValue.toString());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">JIRA Sync Management</h2>
        <div className="flex gap-2">
          <Button
            onClick={performIncrementalSync}
            disabled={syncStatus.isRunning}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus.isRunning ? 'animate-spin' : ''}`} />
            Incremental Sync
          </Button>
          <Button
            onClick={performFullSync}
            disabled={syncStatus.isRunning}
          >
            <Download className="w-4 h-4 mr-2" />
            Full Sync
          </Button>
        </div>
      </div>

      {/* Current Sync Status */}
      {syncStatus.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 animate-pulse" />
              Sync in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{syncStatus.currentStep}</span>
                  <span>{syncStatus.progress}%</span>
                </div>
                <Progress value={syncStatus.progress} className="h-2" />
              </div>
              
              {syncStatus.totalItems > 0 && (
                <div className="text-sm text-gray-600">
                  Processed: {syncStatus.processedItems} / {syncStatus.totalItems}
                </div>
              )}

              {syncStatus.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {syncStatus.errors.length} error(s) occurred during sync
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Sync Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Sync</p>
                  <p className="text-sm text-gray-600">Automatically sync data at intervals</p>
                </div>
                <Button
                  variant={autoSyncEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAutoSync}
                >
                  {autoSyncEnabled ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  {autoSyncEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {autoSyncEnabled && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sync Interval (minutes)</label>
                  <select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm space-y-1">
                  <p><strong>Last Sync:</strong> {syncStatus.lastSync ? syncStatus.lastSync.toLocaleString() : 'Never'}</p>
                  <p><strong>Next Sync:</strong> {autoSyncEnabled && syncStatus.lastSync ? 
                    new Date(syncStatus.lastSync.getTime() + syncInterval * 60 * 1000).toLocaleString() : 
                    'Manual only'
                  }</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sync Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncResults.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((syncResults.filter(r => r.success).length / syncResults.length) * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Avg Duration</p>
                      <p className="text-2xl font-bold">
                        {Math.round(syncResults.reduce((sum, r) => sum + r.duration, 0) / syncResults.length / 1000)}s
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-sm">Recent Syncs</p>
                    {syncResults.slice(0, 3).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {result.ticketsProcessed} tickets, {result.cmdbItemsProcessed} CIs
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(result.duration / 1000)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {syncResults.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No sync history available</p>
                  <p className="text-sm">Run your first sync to see statistics</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sync History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {result.success ? 'Sync Completed' : 'Sync Failed'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {result.ticketsProcessed} tickets, {result.cmdbItemsProcessed} CMDB items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Math.round(result.duration / 1000)}s</p>
                  {result.errors.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {result.errors.length} errors
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {syncResults.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>No sync history available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
