import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Server,
  Activity,
  Calendar,
  DollarSign,
  PieChart,
  LineChart,
  Filter,
  RefreshCw,
  Mail,
  Settings
} from 'lucide-react';

interface ReportData {
  incident?: any;
  problem?: any;
  change?: any;
  sla?: any;
  cmdb?: any;
  availability?: any;
  kpi?: any;
  capacity?: any;
  financial?: any;
  generatedAt?: string;
}

interface KPIMetric {
  name: string;
  value: number | string;
  target: number | string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

export default function ITILReports() {
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');

  // KPI Metrics theo chuẩn ITIL v4
  const kpiMetrics: KPIMetric[] = [
    {
      name: 'MTTR (Mean Time To Repair)',
      value: '4.2h',
      target: '< 4h',
      status: 'warning',
      trend: 'down',
      unit: 'hours'
    },
    {
      name: 'MTBF (Mean Time Between Failures)',
      value: '168h',
      target: '> 144h',
      status: 'good',
      trend: 'up',
      unit: 'hours'
    },
    {
      name: 'First Call Resolution Rate',
      value: '78%',
      target: '> 80%',
      status: 'warning',
      trend: 'up',
      unit: '%'
    },
    {
      name: 'Service Availability',
      value: '99.95%',
      target: '> 99.9%',
      status: 'good',
      trend: 'stable',
      unit: '%'
    },
    {
      name: 'Change Success Rate',
      value: '94%',
      target: '> 95%',
      status: 'warning',
      trend: 'down',
      unit: '%'
    },
    {
      name: 'SLA Compliance',
      value: '87%',
      target: '> 90%',
      status: 'critical',
      trend: 'down',
      unit: '%'
    },
    {
      name: 'Customer Satisfaction',
      value: '4.2',
      target: '> 4.0',
      status: 'good',
      trend: 'up',
      unit: '/5'
    },
    {
      name: 'Problem Resolution Rate',
      value: '92%',
      target: '> 85%',
      status: 'good',
      trend: 'up',
      unit: '%'
    }
  ];

  const capacityMetrics = [
    {
      resource: 'CPU Usage',
      current: 68,
      threshold: 80,
      forecast: 75,
      status: 'good'
    },
    {
      resource: 'Memory Usage',
      current: 82,
      threshold: 85,
      forecast: 88,
      status: 'warning'
    },
    {
      resource: 'Disk Space',
      current: 91,
      threshold: 90,
      forecast: 95,
      status: 'critical'
    },
    {
      resource: 'Network Bandwidth',
      current: 45,
      threshold: 70,
      forecast: 52,
      status: 'good'
    }
  ];

  const financialMetrics = [
    {
      category: 'IT Operating Costs',
      budget: 1000000,
      actual: 920000,
      variance: -8,
      status: 'good'
    },
    {
      category: 'Service Desk Costs',
      budget: 200000,
      actual: 215000,
      variance: 7.5,
      status: 'warning'
    },
    {
      category: 'Infrastructure Costs',
      budget: 500000,
      actual: 485000,
      variance: -3,
      status: 'good'
    },
    {
      category: 'Software Licensing',
      budget: 300000,
      actual: 320000,
      variance: 6.7,
      status: 'warning'
    }
  ];

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, startDate, endDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedPeriod === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);
      } else {
        // Tính toán ngày dựa trên period
        const end = new Date();
        const start = new Date();
        
        switch (selectedPeriod) {
          case '7d':
            start.setDate(start.getDate() - 7);
            break;
          case '30d':
            start.setDate(start.getDate() - 30);
            break;
          case '90d':
            start.setDate(start.getDate() - 90);
            break;
          case '1y':
            start.setFullYear(start.getFullYear() - 1);
            break;
        }
        
        params.append('startDate', start.toISOString().split('T')[0]);
        params.append('endDate', end.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/reports/itil-dashboard?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      params.append('period', selectedPeriod);
      
      if (startDate && endDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `itil-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const scheduleReport = async () => {
    // Implement scheduled report functionality
    console.log('Scheduling report...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header với Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo ITIL</h1>
          <p className="text-muted-foreground">Báo cáo toàn diện theo tiêu chuẩn ITIL v4</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày</SelectItem>
              <SelectItem value="30d">30 ngày</SelectItem>
              <SelectItem value="90d">90 ngày</SelectItem>
              <SelectItem value="1y">1 năm</SelectItem>
              <SelectItem value="custom">Tùy chọn</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === 'custom' && (
            <>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholderText="Từ ngày"
              />
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholderText="Đến ngày"
              />
            </>
          )}

          <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => exportReport(exportFormat)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button onClick={scheduleReport} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Lên lịch
          </Button>

          <Button onClick={loadReportData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="kpi">KPI</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="financial">Tài chính</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng Incidents</p>
                    <p className="text-2xl font-bold">{reportData.incident?.summary?.totalIncidents || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng Problems</p>
                    <p className="text-2xl font-bold">{reportData.problem?.summary?.totalProblems || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng Changes</p>
                    <p className="text-2xl font-bold">{reportData.change?.summary?.totalChanges || 0}</p>
                  </div>
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service Availability</p>
                    <p className="text-2xl font-bold">{reportData.availability?.summary?.uptimePercentage || '99.9%'}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Level Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Hiệu suất Service Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">SLA Compliance</span>
                    <span className="text-sm text-muted-foreground">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Response Time SLA</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Resolution Time SLA</span>
                    <span className="text-sm text-muted-foreground">84%</span>
                  </div>
                  <Progress value={84} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPI Tab */}
        <TabsContent value="kpi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Key Performance Indicators (KPI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiMetrics.map((metric, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{metric.name}</h4>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">{metric.value}</span>
                          <Badge className={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Target: {metric.target}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <LineChart className="w-8 h-8 mr-2" />
                Biểu đồ xu hướng hiệu suất sẽ được hiển thị ở đây
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Incident Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Incidents:</span>
                    <span className="font-semibold">{reportData.incident?.summary?.totalIncidents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open:</span>
                    <span className="font-semibold text-red-600">{reportData.incident?.summary?.openIncidents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolved:</span>
                    <span className="font-semibold text-green-600">{reportData.incident?.summary?.resolvedIncidents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution Rate:</span>
                    <span className="font-semibold">{reportData.incident?.summary?.resolutionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MTTR:</span>
                    <span className="font-semibold">{reportData.incident?.summary?.mttr || 0}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.incident?.distribution?.byPriority && Object.entries(reportData.incident.distribution.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span>{priority}:</span>
                      <Badge variant={priority === 'Critical' ? 'destructive' : priority === 'High' ? 'default' : 'secondary'}>
                        {count as number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.incident?.distribution?.byStatus && Object.entries(reportData.incident.distribution.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span>{status}:</span>
                      <Badge variant={status === 'Open' ? 'destructive' : status === 'In Progress' ? 'default' : 'secondary'}>
                        {count as number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Problems Tab */}
        <TabsContent value="problems" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Problem Management Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Problems:</span>
                    <span className="font-semibold">{reportData.problem?.summary?.totalProblems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open:</span>
                    <span className="font-semibold text-orange-600">{reportData.problem?.summary?.openProblems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolved:</span>
                    <span className="font-semibold text-green-600">{reportData.problem?.summary?.resolvedProblems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution Rate:</span>
                    <span className="font-semibold">{reportData.problem?.summary?.resolutionRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Known Error Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Known Errors:</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workarounds Available:</span>
                    <span className="font-semibold text-green-600">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Fixes:</span>
                    <span className="font-semibold text-orange-600">4</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Changes Tab */}
        <TabsContent value="changes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Changes:</span>
                    <span className="font-semibold">{reportData.change?.summary?.totalChanges || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful:</span>
                    <span className="font-semibold text-green-600">{reportData.change?.summary?.successfulChanges || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-semibold text-red-600">{reportData.change?.summary?.failedChanges || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-semibold">{reportData.change?.summary?.successRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Emergency:</span>
                    <span className="font-semibold text-red-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month:</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-semibold">100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Advisory Board</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Pending Approval:</span>
                    <span className="font-semibold text-orange-600">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span className="font-semibold text-green-600">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected:</span>
                    <span className="font-semibold text-red-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Capacity Planning & Resource Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capacityMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric.resource}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Current: {metric.current}%</span>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={metric.current} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Threshold: {metric.threshold}%</span>
                        <span>Forecast: {metric.forecast}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Disk Space:</strong> Cần mở rộng trong 2 tuần tới
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Memory:</strong> Theo dõi sát sao, có thể cần nâng cấp
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <PieChart className="w-8 h-8 mr-2" />
                  Biểu đồ dự báo capacity sẽ được hiển thị ở đây
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                IT Financial Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{metric.category}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Budget: ${metric.budget.toLocaleString()}</span>
                        <span>Actual: ${metric.actual.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${metric.variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.variance > 0 ? '+' : ''}{metric.variance}%
                      </div>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost per Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Email Service:</span>
                    <span className="font-semibold">$2.50/user/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Storage:</span>
                    <span className="font-semibold">$0.15/GB/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Service:</span>
                    <span className="font-semibold">$45/instance/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backup Service:</span>
                    <span className="font-semibold">$0.08/GB/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>ITSM Investment:</span>
                    <span className="font-semibold">$150,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Savings:</span>
                    <span className="font-semibold text-green-600">$85,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback Period:</span>
                    <span className="font-semibold">1.8 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3-Year ROI:</span>
                    <span className="font-semibold text-green-600">68%</span>
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
