import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCISchema, insertTicketSchema, insertSLAMetricSchema } from "@shared/schema";
import { z } from "zod";

// Error handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation middleware
const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: Function) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body', details: error });
  }
};

// Global error handler
const errorHandler = (error: any, req: Request, res: Response, next: Function) => {
  console.error('API Error:', error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({ error: 'Internal server error' });
};

// Helper function to calculate next run time
function calculateNextRun(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Configuration Items
  app.get('/api/cis', asyncHandler(async (req: Request, res: Response) => {
    const cis = await storage.getAllCIs();
    res.json({ success: true, data: cis });
  }));

  app.get('/api/cis/:id', asyncHandler(async (req: Request, res: Response) => {
    const ci = await storage.getCIById(req.params.id);
    if (!ci) {
      return res.status(404).json({ error: 'CI not found' });
    }
    res.json({ success: true, data: ci });
  }));

  app.post('/api/cis', validateBody(insertCISchema), asyncHandler(async (req: Request, res: Response) => {
    const ci = await storage.insertCI(req.body);
    res.status(201).json({ success: true, data: ci });
  }));

  app.put('/api/cis/:id', validateBody(insertCISchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const ci = await storage.updateCI(req.params.id, req.body);
    if (!ci) {
      return res.status(404).json({ error: 'CI not found' });
    }
    res.json({ success: true, data: ci });
  }));

  app.delete('/api/cis/:id', asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteCI(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'CI not found' });
    }
    res.json({ success: true });
  }));

  // CI Relationships
  app.get('/api/cis/:id/relationships', asyncHandler(async (req: Request, res: Response) => {
    const relationships = await storage.getCIRelationships(req.params.id);
    res.json({ success: true, data: relationships });
  }));

  // Tickets
  app.get('/api/tickets', asyncHandler(async (req: Request, res: Response) => {
    const tickets = await storage.getTickets(req.query);
    res.json({ success: true, data: tickets });
  }));

  app.get('/api/tickets/:id', asyncHandler(async (req: Request, res: Response) => {
    const ticket = await storage.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ success: true, data: ticket });
  }));

  app.post('/api/tickets', validateBody(insertTicketSchema), asyncHandler(async (req: Request, res: Response) => {
    const ticket = await storage.insertTicket(req.body);
    res.status(201).json({ success: true, data: ticket });
  }));

  app.put('/api/tickets/:id', validateBody(insertTicketSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
    const ticket = await storage.updateTicket(req.params.id, req.body);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ success: true, data: ticket });
  }));

  // Bulk ticket operations
  app.post('/api/tickets/bulk/:action', asyncHandler(async (req: Request, res: Response) => {
    const { action } = req.params;
    const { ticketIds, data } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds)) {
      return res.status(400).json({ error: 'ticketIds array is required' });
    }

    let results = [];

    switch (action) {
      case 'assign':
        if (!data.assignee) {
          return res.status(400).json({ error: 'assignee is required for assign action' });
        }
        for (const id of ticketIds) {
          const ticket = await storage.updateTicket(id, { assignee: data.assignee });
          if (ticket) results.push(ticket);
        }
        break;

      case 'close':
        for (const id of ticketIds) {
          const ticket = await storage.updateTicket(id, { 
            status: 'Closed',
            resolvedAt: new Date()
          });
          if (ticket) results.push(ticket);
        }
        break;

      case 'priority':
        if (!data.priority) {
          return res.status(400).json({ error: 'priority is required for priority action' });
        }
        for (const id of ticketIds) {
          const ticket = await storage.updateTicket(id, { priority: data.priority });
          if (ticket) results.push(ticket);
        }
        break;

      case 'export':
        // Mock export - in production, generate actual export file
        const tickets = [];
        for (const id of ticketIds) {
          const ticket = await storage.getTicketById(id);
          if (ticket) tickets.push(ticket);
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="tickets-export-${new Date().toISOString().split('T')[0]}.json"`);
        return res.json({ success: true, data: tickets });

      default:
        return res.status(400).json({ error: `Unknown bulk action: ${action}` });
    }

    res.json({ 
      success: true, 
      data: results,
      message: `Successfully performed ${action} on ${results.length} tickets`
    });
  }));

  // SLA Metrics
  app.get('/api/sla-metrics', asyncHandler(async (req: Request, res: Response) => {
    const metrics = await storage.getSLAMetrics();
    res.json({ success: true, data: metrics });
  }));

  app.post('/api/sla-metrics', validateBody(insertSLAMetricSchema), asyncHandler(async (req: Request, res: Response) => {
    const metric = await storage.insertSLAMetric(req.body);
    res.status(201).json({ success: true, data: metric });
  }));

  // Dashboard data
  app.get('/api/dashboard', asyncHandler(async (req: Request, res: Response) => {
    const [cis, tickets, slaMetrics] = await Promise.all([
      storage.getAllCIs(),
      storage.getTickets({}),
      storage.getSLAMetrics()
    ]);

    const dashboardData = {
      totalCIs: cis.length,
      activeCIs: cis.filter(ci => ci.status === 'Active').length,
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => ['Open', 'In Progress'].includes(t.status!)).length,
      criticalTickets: tickets.filter(t => t.priority === 'Critical').length,
      slaCompliance: slaMetrics.filter(m => !m.breached).length / Math.max(slaMetrics.length, 1) * 100,
      recentTickets: tickets.slice(0, 5),
      topAffectedCIs: cis.slice(0, 5)
    };

    res.json({ success: true, data: dashboardData });
  }));

  // ITIL Reports
  app.get('/api/reports/incident', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const report = await storage.getIncidentReport(start, end);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating incident report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate incident report' 
      });
    }
  }));

  app.get('/api/reports/problem', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const report = await storage.getProblemReport(start, end);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating problem report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate problem report' 
      });
    }
  }));

  app.get('/api/reports/change', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const report = await storage.getChangeReport(start, end);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating change report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate change report' 
      });
    }
  }));

  app.get('/api/reports/sla', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const report = await storage.getSLAReport(start, end);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating SLA report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate SLA report' 
      });
    }
  }));

  app.get('/api/reports/cmdb', asyncHandler(async (req: Request, res: Response) => {
    try {
      const report = await storage.getCMDBReport();
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating CMDB report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate CMDB report' 
      });
    }
  }));

  app.get('/api/reports/availability', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const report = await storage.getServiceAvailabilityReport(start, end);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating service availability report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate service availability report' 
      });
    }
  }));

  // Combined ITIL Dashboard Report
  app.get('/api/reports/itil-dashboard', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      // Generate all reports in parallel
      const [
        incidentReport,
        problemReport,
        changeReport,
        slaReport,
        cmdbReport,
        availabilityReport
      ] = await Promise.all([
        storage.getIncidentReport(start, end),
        storage.getProblemReport(start, end),
        storage.getChangeReport(start, end),
        storage.getSLAReport(start, end),
        storage.getCMDBReport(),
        storage.getServiceAvailabilityReport(start, end)
      ]);

      const dashboardReport = {
        incident: incidentReport,
        problem: problemReport,
        change: changeReport,
        sla: slaReport,
        cmdb: cmdbReport,
        availability: availabilityReport,
        generatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: dashboardReport });
    } catch (error) {
      console.error('Error generating ITIL dashboard report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate ITIL dashboard report' 
      });
    }
  }));

  // Export Reports API
  app.get('/api/reports/export', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { format, period, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      // Generate report data
      const [
        incidentReport,
        problemReport,
        changeReport,
        slaReport,
        cmdbReport,
        availabilityReport
      ] = await Promise.all([
        storage.getIncidentReport(start, end),
        storage.getProblemReport(start, end),
        storage.getChangeReport(start, end),
        storage.getSLAReport(start, end),
        storage.getCMDBReport(),
        storage.getServiceAvailabilityReport(start, end)
      ]);

      const reportData = {
        incident: incidentReport,
        problem: problemReport,
        change: changeReport,
        sla: slaReport,
        cmdb: cmdbReport,
        availability: availabilityReport,
        generatedAt: new Date().toISOString(),
        period: period || '30d'
      };

      // Set appropriate headers based on format
      let contentType = 'application/json';
      let fileName = `itil-report-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileName += '.xlsx';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          fileName += '.pdf';
          break;
        case 'csv':
          contentType = 'text/csv';
          fileName += '.csv';
          break;
        default:
          contentType = 'application/json';
          fileName += '.json';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // For now, return JSON data (implement actual Excel/PDF generation later)
      if (format === 'csv') {
        // Simple CSV export for incidents
        const csvData = [
          'Type,ID,Title,Status,Priority,Created,Resolved',
          ...reportData.incident.trends.map((inc: any) => 
            `Incident,${inc.id},${inc.title},${inc.status},${inc.priority},${inc.createdAt},${inc.resolvedAt || ''}`
          ),
          ...reportData.problem.trends.map((prob: any) => 
            `Problem,${prob.id},${prob.title},${prob.status},${prob.priority},${prob.createdAt},${prob.resolvedAt || ''}`
          ),
          ...reportData.change.trends.map((chg: any) => 
            `Change,${chg.id},${chg.title},${chg.status},${chg.priority},${chg.createdAt},${chg.resolvedAt || ''}`
          )
        ].join('\n');
        
        res.send(csvData);
      } else {
        // Return JSON for Excel and PDF (implement proper generation later)
        res.json(reportData);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export report' 
      });
    }
  }));

  // Scheduled Reports API
  app.get('/api/reports/scheduled', asyncHandler(async (req: Request, res: Response) => {
    try {
      // Mock scheduled reports - in production, this would come from database
      const scheduledReports = [
        {
          id: '1',
          name: 'Weekly ITIL Summary',
          format: 'excel',
          frequency: 'weekly',
          recipients: ['manager@company.com', 'itil-team@company.com'],
          sections: ['summary', 'incidents', 'problems', 'changes'],
          enabled: true,
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: 'Monthly Executive Report',
          format: 'pdf',
          frequency: 'monthly',
          recipients: ['ceo@company.com', 'cto@company.com'],
          sections: ['summary', 'kpi', 'financial'],
          enabled: true,
          nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ];

      res.json({ success: true, data: scheduledReports });
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch scheduled reports' 
      });
    }
  }));

  app.post('/api/reports/scheduled', asyncHandler(async (req: Request, res: Response) => {
    try {
      const reportData = req.body;
      
      // Mock creation - in production, save to database
      const newReport = {
        id: Date.now().toString(),
        ...reportData,
        nextRun: calculateNextRun(reportData.frequency),
        lastRun: null
      };

      res.json({ success: true, data: newReport });
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create scheduled report' 
      });
    }
  }));

  app.put('/api/reports/scheduled/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Mock update - in production, update in database
      const updatedReport = {
        id,
        ...updates,
        nextRun: updates.frequency ? calculateNextRun(updates.frequency) : undefined
      };

      res.json({ success: true, data: updatedReport });
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update scheduled report' 
      });
    }
  }));

  app.delete('/api/reports/scheduled/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Mock deletion - in production, delete from database
      console.log(`Deleted scheduled report: ${id}`);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete scheduled report' 
      });
    }
  }));

  // Email notification endpoint
  app.post('/api/reports/send-email', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { recipients, subject, reportData, format } = req.body;
      
      // Mock email sending - in production, use email service like SendGrid, AWS SES, etc.
      console.log('Sending email report:', {
        to: recipients,
        subject,
        format,
        generatedAt: new Date().toISOString()
      });

      // Here you would integrate with email service
      // await emailService.sendReport({ recipients, subject, reportData, format });

      res.json({ 
        success: true, 
        message: `Report sent to ${recipients.length} recipients` 
      });
    } catch (error) {
      console.error('Error sending email report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send email report' 
      });
    }
  }));

  // Use error handler
  app.use(errorHandler);

  const httpServer = createServer(app);

  return httpServer;
}