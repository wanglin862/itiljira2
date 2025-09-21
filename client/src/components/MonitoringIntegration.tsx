import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Server,
  Wifi,
  Zap,
  TrendingUp,
  Bell,
  Settings,
  Play,
  Pause
} from 'lucide-react';

interface MonitoringAlert {
  id: string;
  source: 'Nagios' | 'Zabbix' | 'Prometheus' | 'SCOM' | 'Custom';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  ciId: string;
  ciName: string;
  timestamp: Date;
  metrics: Record<string, number>;
  status: 'New' | 'Processing' | 'Incident Created' | 'Resolved';
  autoProcessed: boolean;
}

interface MonitoringRule {
  id: string;
  name: string;
  source: string;
  condition: string;
  severity: string;
  assignmentGroup: string;
  enabled: boolean;
  description: string;
}

interface MetricThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export default function MonitoringIntegration() {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [thresholds, setThresholds] = useState<MetricThreshold[]>([]);
  const [isProcessingEnabled, setIsProcessingEnabled] = useState(true);
  const [newRule, setNewRule] = useState<Partial<MonitoringRule>>({});

  // Mock data initialization
  useEffect(() => {
    const mockAlerts: MonitoringAlert[] = [
      {
        id: 'alert-001',
        source: 'Nagios',
        severity: 'Critical',
        message: 'Database connection pool exhausted',
        ciId: 'ci-002',
        ciName: 'Database Primary',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        metrics: { connections: 95, cpu: 85, memory: 78 },
        status: 'Processing',
        autoProcessed: true
      },
      {
        id: 'alert-002',
        source: 'Prometheus',
        severity: 'High',
        message: 'High CPU usage detected',
        ciId: 'ci-001',
        ciName: 'Web Server 01',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        metrics: { cpu: 92, memory: 65, disk: 45 },
        status: 'Incident Created',
        autoProcessed: true
      },
      {
        id: 'alert-003',
        source: 'Zabbix',
        severity: 'Medium',
        message: 'Disk space warning',
        ciId: 'ci-001',
        ciName: 'Web Server 01',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        metrics: { disk: 82, iops: 1200 },
        status: 'New',
        autoProcessed: false
      }
    ];

    const mockRules: MonitoringRule[] = [
      {
        id: 'rule-001',
        name: 'Critical Database Alerts',
        source: 'Nagios',
        condition: 'severity = Critical AND ci_type = Database',
        severity: 'Critical',
        assignmentGroup: 'L1-Database',
        enabled: true,
        description: 'Auto-assign critical database alerts to L1 Database team'
      },
      {
        id: 'rule-002',
        name: 'High CPU Usage',
        source: 'Prometheus',
        condition: 'cpu > 90',
        severity: 'High',
        assignmentGroup: 'L1-Infrastructure',
        enabled: true,
        description: 'Auto-assign high CPU usage alerts'
      },
      {
        id: 'rule-003',
        name: 'Application Errors',
        source: 'Custom',
        condition: 'error_rate > 5%',
        severity: 'High',
        assignmentGroup: 'L1-Application',
        enabled: true,
        description: 'Auto-assign application error alerts'
      }
    ];

    const mockThresholds: MetricThreshold[] = [
      { metric: 'CPU Usage', warning: 80, critical: 90, unit: '%' },
      { metric: 'Memory Usage', warning: 85, critical: 95, unit: '%' },
      { metric: 'Disk Usage', warning: 80, critical: 90, unit: '%' },
      { metric: 'Response Time', warning: 2000, critical: 5000, unit: 'ms' },
      { metric: 'Error Rate', warning: 2, critical: 5, unit: '%' }
    ];

    setAlerts(mockAlerts);
    setRules(mockRules);
    setThresholds(mockThresholds);
  }, []);

  const processAlert = (alert: MonitoringAlert) => {
    // Simulate processing alert and creating incident
    const updatedAlert = {
      ...alert,
      status: 'Processing' as const,
      autoProcessed: true
    };
    
    setAlerts(prev => prev.map(a => a.id === alert.id ? updatedAlert : a));

    // Simulate API call delay
    setTimeout(() => {
      const finalAlert = {
        ...updatedAlert,
        status: 'Incident Created' as const
      };
      setAlerts(prev => prev.map(a => a.id === alert.id ? finalAlert : a));
    }, 2000);
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const addNewRule = () => {
    if (newRule.name && newRule.condition) {
      const rule: MonitoringRule = {
        id: `rule-${Date.now()}`,
        name: newRule.name,
        source: newRule.source || 'Custom',
        condition: newRule.condition,
        severity: newRule.severity || 'Medium',
        assignmentGroup: newRule.assignmentGroup || 'L1-General',
        enabled: true,
        description: newRule.description || ''
      };
      
      setRules(prev => [...prev, rule]);
      setNewRule({});
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Nagios': return <Server className="w-4 h-4" />;
      case 'Zabbix': return <Activity className="w-4 h-4" />;
      case 'Prometheus': return <TrendingUp className="w-4 h-4" />;
      case 'SCOM': return <Database className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
    }
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
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Incident Created': return 'bg-green-100 text-green-800';
      case 'Resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitoring Integration</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Auto-Processing:</span>
            <Button
              size="sm"
              variant={isProcessingEnabled ? "default" : "outline"}
              onClick={() => setIsProcessingEnabled(!isProcessingEnabled)}
            >
              {isProcessingEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isProcessingEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            Active Alerts: {alerts.filter(a => a.status !== 'Resolved').length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Live Alerts</TabsTrigger>
          <TabsTrigger value="rules">Processing Rules</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="integration">Integration Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Monitoring Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(alert.source)}
                          <h3 className="font-semibold">{alert.message}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          CI: {alert.ciName} | Source: {alert.source}
                        </p>
                        <p className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {Object.entries(alert.metrics).map(([metric, value]) => (
                        <div key={metric} className="flex justify-between">
                          <span className="capitalize">{metric}:</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {alert.autoProcessed && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {alert.autoProcessed ? 'Auto-processed' : 'Manual review required'}
                        </span>
                      </div>
                      
                      {alert.status === 'New' && (
                        <Button size="sm" onClick={() => processAlert(alert)}>
                          Process Alert
                        </Button>
                      )}
                      
                      {alert.status === 'Processing' && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Creating incident...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Auto-Processing Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add new rule form */}
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <h4 className="font-medium">Add New Rule</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Rule name"
                      value={newRule.name || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Select onValueChange={(value) => setNewRule(prev => ({ ...prev, source: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nagios">Nagios</SelectItem>
                        <SelectItem value="Zabbix">Zabbix</SelectItem>
                        <SelectItem value="Prometheus">Prometheus</SelectItem>
                        <SelectItem value="SCOM">SCOM</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Condition (e.g., cpu > 90 AND severity = Critical)"
                    value={newRule.condition || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select onValueChange={(value) => setNewRule(prev => ({ ...prev, severity: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Assignment Group"
                      value={newRule.assignmentGroup || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, assignmentGroup: e.target.value }))}
                    />
                  </div>
                  <Button onClick={addNewRule}>Add Rule</Button>
                </div>

                {/* Existing rules */}
                {rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(rule.source)}
                          <h4 className="font-semibold">{rule.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                        <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {rule.condition}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Button
                          size="sm"
                          variant={rule.enabled ? "default" : "outline"}
                          onClick={() => toggleRule(rule.id)}
                        >
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Assignment: {rule.assignmentGroup}</span>
                      <span>Source: {rule.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Metric Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {thresholds.map((threshold, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{threshold.metric}</h4>
                      <span className="text-sm text-gray-500">{threshold.unit}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-yellow-600">Warning</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={threshold.warning}
                            className="w-20"
                            readOnly
                          />
                          <span className="text-sm">{threshold.unit}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-red-600">Critical</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={threshold.critical}
                            className="w-20"
                            readOnly
                          />
                          <span className="text-sm">{threshold.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nagios Webhook</label>
                  <Input value="/api/webhooks/nagios" readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prometheus AlertManager</label>
                  <Input value="/api/webhooks/prometheus" readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zabbix Integration</label>
                  <Input value="/api/webhooks/zabbix" readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Monitoring</label>
                  <Input value="/api/webhooks/custom" readOnly />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Nagios</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Prometheus</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zabbix</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>SCOM</span>
                  <Badge className="bg-red-100 text-red-800">Disconnected</Badge>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure your monitoring tools to send alerts to the webhook endpoints above.
                    Include CI ID in the payload for automatic assignment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

