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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
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

  // Configuration Items (CIs) Routes
  app.get('/api/cis', asyncHandler(async (req: Request, res: Response) => {
    try {
      const cis = await storage.getAllCIs();
      res.json({ success: true, data: cis });
    } catch (error) {
      console.error('Error fetching CIs:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch configuration items' 
      });
    }
  }));

  app.get('/api/cis/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
      const ci = await storage.getCIById(req.params.id);
      if (!ci) {
        return res.status(404).json({ 
          success: false, 
          error: 'Configuration item not found' 
        });
      }
      res.json({ success: true, data: ci });
    } catch (error) {
      console.error('Error fetching CI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch configuration item' 
      });
    }
  }));

  app.post('/api/cis', 
    validateBody(insertCISchema),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const ci = await storage.insertCI(req.body);
        res.status(201).json({ success: true, data: ci });
      } catch (error) {
        console.error('Error creating CI:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create configuration item' 
        });
      }
    })
  );

  app.put('/api/cis/:id',
    validateBody(insertCISchema.partial()),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const ci = await storage.updateCI(req.params.id, req.body);
        if (!ci) {
          return res.status(404).json({ 
            success: false, 
            error: 'Configuration item not found' 
          });
        }
        res.json({ success: true, data: ci });
      } catch (error) {
        console.error('Error updating CI:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to update configuration item' 
        });
      }
    })
  );

  app.delete('/api/cis/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteCI(req.params.id);
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          error: 'Configuration item not found' 
        });
      }
      res.json({ success: true, message: 'Configuration item deleted' });
    } catch (error) {
      console.error('Error deleting CI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete configuration item' 
      });
    }
  }));

  // Tickets Routes
  app.get('/api/tickets', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { status, priority, ciId } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (ciId) filters.ciId = ciId;

      const tickets = await storage.getTickets(filters);
      res.json({ success: true, data: tickets });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch tickets' 
      });
    }
  }));

  app.get('/api/tickets/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
      const ticket = await storage.getTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ 
          success: false, 
          error: 'Ticket not found' 
        });
      }
      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch ticket' 
      });
    }
  }));

  app.post('/api/tickets',
    validateBody(insertTicketSchema),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const ticket = await storage.insertTicket(req.body);
        res.status(201).json({ success: true, data: ticket });
      } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create ticket' 
        });
      }
    })
  );

  app.put('/api/tickets/:id',
    validateBody(insertTicketSchema.partial()),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const ticket = await storage.updateTicket(req.params.id, req.body);
        if (!ticket) {
          return res.status(404).json({ 
            success: false, 
            error: 'Ticket not found' 
          });
        }
        res.json({ success: true, data: ticket });
      } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to update ticket' 
        });
      }
    })
  );

  // SLA Metrics Routes
  app.get('/api/sla-metrics', asyncHandler(async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getSLAMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching SLA metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch SLA metrics' 
      });
    }
  }));

  app.post('/api/sla-metrics',
    validateBody(insertSLAMetricSchema),
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const metric = await storage.insertSLAMetric(req.body);
        res.status(201).json({ success: true, data: metric });
      } catch (error) {
        console.error('Error creating SLA metric:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create SLA metric' 
        });
      }
    })
  );

  // Dashboard Data Route
  app.get('/api/dashboard', asyncHandler(async (req: Request, res: Response) => {
    try {
      const [cis, tickets, slaMetrics] = await Promise.all([
        storage.getAllCIs(),
        storage.getTickets({}),
        storage.getSLAMetrics()
      ]);

      const dashboardData = {
        totalCIs: cis.length,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length,
        breachedSLAs: slaMetrics.filter(m => m.breached === 'true').length,
        ticketsByStatus: tickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        ticketsByPriority: tickets.reduce((acc, ticket) => {
          acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentTickets: tickets.slice(0, 10),
        recentCIs: cis.slice(0, 10)
      };

      res.json({ success: true, data: dashboardData });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch dashboard data' 
      });
    }
  }));

  // CI Relationships Routes
  app.get('/api/cis/:id/relationships', asyncHandler(async (req: Request, res: Response) => {
    try {
      const relationships = await storage.getCIRelationships(req.params.id);
      res.json({ success: true, data: relationships });
    } catch (error) {
      console.error('Error fetching CI relationships:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch CI relationships' 
      });
    }
  }));

  // Tickets related to CI
  app.get('/api/cis/:id/tickets', asyncHandler(async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getTickets({ ciId: req.params.id });
      res.json({ success: true, data: tickets });
    } catch (error) {
      console.error('Error fetching CI tickets:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch tickets for CI' 
      });
    }
  }));

  // ITIL Reporting Routes
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

  const httpServer = createServer(app);

  return httpServer;
}
