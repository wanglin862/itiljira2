// ITIL Report Export Service
export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  period: string;
  startDate?: Date;
  endDate?: Date;
  includeCharts?: boolean;
  sections?: string[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  format: 'excel' | 'pdf' | 'csv';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  sections: string[];
  enabled: boolean;
  nextRun?: Date;
  lastRun?: Date;
}

export class ReportExportService {
  private static instance: ReportExportService;

  public static getInstance(): ReportExportService {
    if (!ReportExportService.instance) {
      ReportExportService.instance = new ReportExportService();
    }
    return ReportExportService.instance;
  }

  // Export báo cáo với format được chọn
  async exportReport(options: ExportOptions): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('format', options.format);
      params.append('period', options.period);
      
      if (options.startDate && options.endDate) {
        params.append('startDate', options.startDate.toISOString().split('T')[0]);
        params.append('endDate', options.endDate.toISOString().split('T')[0]);
      }

      if (options.sections && options.sections.length > 0) {
        params.append('sections', options.sections.join(','));
      }

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const fileExtension = options.format === 'excel' ? 'xlsx' : options.format;
        a.download = `itil-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error(`Export failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Xuất báo cáo Excel với nhiều worksheet
  async exportExcelReport(data: any, options: ExportOptions): Promise<void> {
    const workbook = {
      SheetNames: [],
      Sheets: {} as any
    };

    // Summary Sheet
    if (!options.sections || options.sections.includes('summary')) {
      const summaryData = [
        ['ITIL Dashboard Summary Report'],
        ['Generated At:', data.generatedAt],
        ['Period:', options.period],
        [''],
        ['Metric', 'Value'],
        ['Total Incidents', data.incident?.summary?.totalIncidents || 0],
        ['Total Problems', data.problem?.summary?.totalProblems || 0],
        ['Total Changes', data.change?.summary?.totalChanges || 0],
        ['Service Availability', data.availability?.summary?.uptimePercentage || '99.9%'],
        ['SLA Compliance', data.sla?.summary?.complianceRate || '87%']
      ];

      workbook.SheetNames.push('Summary');
      workbook.Sheets['Summary'] = this.arrayToWorksheet(summaryData);
    }

    // Incidents Sheet
    if (!options.sections || options.sections.includes('incidents')) {
      const incidentData = [
        ['Incident Report'],
        [''],
        ['ID', 'Title', 'Status', 'Priority', 'Created', 'Resolved', 'MTTR (hours)'],
        ...(data.incident?.trends || []).map((inc: any) => [
          inc.id,
          inc.title,
          inc.status,
          inc.priority,
          inc.createdAt,
          inc.resolvedAt || '',
          inc.mttr || ''
        ])
      ];

      workbook.SheetNames.push('Incidents');
      workbook.Sheets['Incidents'] = this.arrayToWorksheet(incidentData);
    }

    // Problems Sheet
    if (!options.sections || options.sections.includes('problems')) {
      const problemData = [
        ['Problem Report'],
        [''],
        ['ID', 'Title', 'Status', 'Priority', 'Created', 'Resolved', 'Root Cause'],
        ...(data.problem?.trends || []).map((prob: any) => [
          prob.id,
          prob.title,
          prob.status,
          prob.priority,
          prob.createdAt,
          prob.resolvedAt || '',
          prob.rootCause || ''
        ])
      ];

      workbook.SheetNames.push('Problems');
      workbook.Sheets['Problems'] = this.arrayToWorksheet(problemData);
    }

    // Changes Sheet
    if (!options.sections || options.sections.includes('changes')) {
      const changeData = [
        ['Change Report'],
        [''],
        ['ID', 'Title', 'Status', 'Priority', 'Created', 'Implemented', 'Success'],
        ...(data.change?.trends || []).map((chg: any) => [
          chg.id,
          chg.title,
          chg.status,
          chg.priority,
          chg.createdAt,
          chg.implementedAt || '',
          chg.successful ? 'Yes' : 'No'
        ])
      ];

      workbook.SheetNames.push('Changes');
      workbook.Sheets['Changes'] = this.arrayToWorksheet(changeData);
    }

    // Convert workbook to blob and download
    // Note: This would require a library like xlsx or exceljs for proper implementation
    console.log('Excel export prepared:', workbook);
  }

  // Xuất báo cáo PDF
  async exportPDFReport(data: any, options: ExportOptions): Promise<void> {
    // PDF generation would require a library like jsPDF or puppeteer
    // For now, we'll prepare the data structure
    
    const pdfContent = {
      title: 'ITIL Dashboard Report',
      generatedAt: data.generatedAt,
      period: options.period,
      sections: []
    };

    if (!options.sections || options.sections.includes('summary')) {
      pdfContent.sections.push({
        title: 'Executive Summary',
        content: [
          `Total Incidents: ${data.incident?.summary?.totalIncidents || 0}`,
          `Total Problems: ${data.problem?.summary?.totalProblems || 0}`,
          `Total Changes: ${data.change?.summary?.totalChanges || 0}`,
          `Service Availability: ${data.availability?.summary?.uptimePercentage || '99.9%'}`,
          `SLA Compliance: ${data.sla?.summary?.complianceRate || '87%'}`
        ]
      });
    }

    if (!options.sections || options.sections.includes('incidents')) {
      pdfContent.sections.push({
        title: 'Incident Management',
        content: [
          `Resolution Rate: ${data.incident?.summary?.resolutionRate || 0}%`,
          `Mean Time To Repair: ${data.incident?.summary?.mttr || 0} hours`,
          `Open Incidents: ${data.incident?.summary?.openIncidents || 0}`,
          `Resolved Incidents: ${data.incident?.summary?.resolvedIncidents || 0}`
        ]
      });
    }

    console.log('PDF export prepared:', pdfContent);
  }

  // Xuất báo cáo CSV
  async exportCSVReport(data: any, options: ExportOptions): Promise<string> {
    const csvSections: string[] = [];

    // Summary section
    if (!options.sections || options.sections.includes('summary')) {
      csvSections.push([
        'ITIL Dashboard Summary Report',
        `Generated At,${data.generatedAt}`,
        `Period,${options.period}`,
        '',
        'Metric,Value',
        `Total Incidents,${data.incident?.summary?.totalIncidents || 0}`,
        `Total Problems,${data.problem?.summary?.totalProblems || 0}`,
        `Total Changes,${data.change?.summary?.totalChanges || 0}`,
        `Service Availability,${data.availability?.summary?.uptimePercentage || '99.9%'}`,
        `SLA Compliance,${data.sla?.summary?.complianceRate || '87%'}`,
        ''
      ].join('\n'));
    }

    // Incidents section
    if (!options.sections || options.sections.includes('incidents')) {
      const incidentRows = [
        'Incident Report',
        '',
        'ID,Title,Status,Priority,Created,Resolved,MTTR (hours)',
        ...(data.incident?.trends || []).map((inc: any) => 
          `${inc.id},"${inc.title}",${inc.status},${inc.priority},${inc.createdAt},${inc.resolvedAt || ''},${inc.mttr || ''}`
        ),
        ''
      ];
      csvSections.push(incidentRows.join('\n'));
    }

    // Problems section
    if (!options.sections || options.sections.includes('problems')) {
      const problemRows = [
        'Problem Report',
        '',
        'ID,Title,Status,Priority,Created,Resolved,Root Cause',
        ...(data.problem?.trends || []).map((prob: any) => 
          `${prob.id},"${prob.title}",${prob.status},${prob.priority},${prob.createdAt},${prob.resolvedAt || ''},"${prob.rootCause || ''}"`
        ),
        ''
      ];
      csvSections.push(problemRows.join('\n'));
    }

    // Changes section
    if (!options.sections || options.sections.includes('changes')) {
      const changeRows = [
        'Change Report',
        '',
        'ID,Title,Status,Priority,Created,Implemented,Success',
        ...(data.change?.trends || []).map((chg: any) => 
          `${chg.id},"${chg.title}",${chg.status},${chg.priority},${chg.createdAt},${chg.implementedAt || ''},${chg.successful ? 'Yes' : 'No'}`
        ),
        ''
      ];
      csvSections.push(changeRows.join('\n'));
    }

    return csvSections.join('\n');
  }

  // Quản lý scheduled reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const response = await fetch('/api/reports/scheduled');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      return [];
    }
  }

  async createScheduledReport(report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> {
    try {
      const response = await fetch('/api/reports/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      throw error;
    }
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      throw error;
    }
  }

  async deleteScheduledReport(id: string): Promise<void> {
    try {
      await fetch(`/api/reports/scheduled/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      throw error;
    }
  }

  // Helper method to convert array to worksheet format
  private arrayToWorksheet(data: any[][]): any {
    const worksheet: any = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };

    for (let R = 0; R !== data.length; ++R) {
      for (let C = 0; C !== data[R].length; ++C) {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;

        const cell: any = { v: data[R][C] };
        if (cell.v == null) continue;

        const cellRef = this.encodeCell({ c: C, r: R });
        
        if (typeof cell.v === 'number') cell.t = 'n';
        else if (typeof cell.v === 'boolean') cell.t = 'b';
        else if (cell.v instanceof Date) {
          cell.t = 'n';
          cell.z = 'mm-dd-yy';
          cell.v = this.dateToSerial(cell.v);
        } else cell.t = 's';

        worksheet[cellRef] = cell;
      }
    }
    
    if (range.s.c < 10000000) worksheet['!ref'] = this.encodeRange(range);
    return worksheet;
  }

  private encodeCell(cell: { c: number; r: number }): string {
    return String.fromCharCode(65 + cell.c) + (cell.r + 1);
  }

  private encodeRange(range: any): string {
    return this.encodeCell(range.s) + ':' + this.encodeCell(range.e);
  }

  private dateToSerial(date: Date): number {
    return (date.getTime() - new Date(1900, 0, 1).getTime()) / (24 * 60 * 60 * 1000) + 1;
  }
}

export const reportExportService = ReportExportService.getInstance();

