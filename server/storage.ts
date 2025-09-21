import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, count, sql as sqlOp, gte, lte, desc, asc } from "drizzle-orm";
import { 
  type User, 
  type InsertUser,
  type ConfigurationItem,
  type InsertCI,
  type Ticket,
  type InsertTicket,
  type SLAMetric,
  type InsertSLAMetric,
  type CIRelationship,
  users,
  configurationItems,
  tickets,
  slaMetrics,
  ciRelationships
} from "@shared/schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // CI methods
  getAllCIs(): Promise<ConfigurationItem[]>;
  getCIById(id: string): Promise<ConfigurationItem | undefined>;
  insertCI(ci: InsertCI): Promise<ConfigurationItem>;
  updateCI(id: string, ci: Partial<InsertCI>): Promise<ConfigurationItem | undefined>;
  deleteCI(id: string): Promise<boolean>;
  
  // Ticket methods
  getTickets(filters: Record<string, any>): Promise<Ticket[]>;
  getTicketById(id: string): Promise<Ticket | undefined>;
  insertTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // SLA methods
  getSLAMetrics(): Promise<SLAMetric[]>;
  insertSLAMetric(metric: InsertSLAMetric): Promise<SLAMetric>;
  
  // CI Relationship methods
  getCIRelationships(ciId: string): Promise<CIRelationship[]>;
  
  // ITIL Reporting methods
  getIncidentReport(startDate?: Date, endDate?: Date): Promise<any>;
  getProblemReport(startDate?: Date, endDate?: Date): Promise<any>;
  getChangeReport(startDate?: Date, endDate?: Date): Promise<any>;
  getSLAReport(startDate?: Date, endDate?: Date): Promise<any>;
  getCMDBReport(): Promise<any>;
  getServiceAvailabilityReport(startDate?: Date, endDate?: Date): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // CI methods
  async getAllCIs(): Promise<ConfigurationItem[]> {
    return await db.select().from(configurationItems);
  }

  async getCIById(id: string): Promise<ConfigurationItem | undefined> {
    const result = await db.select().from(configurationItems).where(eq(configurationItems.id, id));
    return result[0];
  }

  async insertCI(ci: InsertCI): Promise<ConfigurationItem> {
    const result = await db.insert(configurationItems).values(ci).returning();
    return result[0];
  }

  async updateCI(id: string, ci: Partial<InsertCI>): Promise<ConfigurationItem | undefined> {
    const result = await db.update(configurationItems)
      .set({ ...ci, updatedAt: new Date() })
      .where(eq(configurationItems.id, id))
      .returning();
    return result[0];
  }

  async deleteCI(id: string): Promise<boolean> {
    const result = await db.delete(configurationItems).where(eq(configurationItems.id, id));
    return result.count > 0;
  }

  // Ticket methods
  async getTickets(filters: Record<string, any>): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    // Apply filters
    const conditions = [];
    if (filters.status) conditions.push(eq(tickets.status, filters.status));
    if (filters.priority) conditions.push(eq(tickets.priority, filters.priority));
    if (filters.ciId) conditions.push(eq(tickets.ciId, filters.ciId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getTicketById(id: string): Promise<Ticket | undefined> {
    const result = await db.select().from(tickets).where(eq(tickets.id, id));
    return result[0];
  }

  async insertTicket(ticket: InsertTicket): Promise<Ticket> {
    const result = await db.insert(tickets).values(ticket).returning();
    return result[0];
  }

  async updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const result = await db.update(tickets)
      .set({ ...ticket, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return result[0];
  }

  // SLA methods
  async getSLAMetrics(): Promise<SLAMetric[]> {
    return await db.select().from(slaMetrics);
  }

  async insertSLAMetric(metric: InsertSLAMetric): Promise<SLAMetric> {
    const result = await db.insert(slaMetrics).values(metric).returning();
    return result[0];
  }

  // CI Relationship methods
  async getCIRelationships(ciId: string): Promise<CIRelationship[]> {
    return await db.select().from(ciRelationships)
      .where(eq(ciRelationships.sourceId, ciId));
  }

  // ITIL Reporting methods
  async getIncidentReport(startDate?: Date, endDate?: Date): Promise<any> {
    const conditions = [eq(tickets.type, 'Incident')];
    if (startDate) conditions.push(gte(tickets.createdAt, startDate));
    if (endDate) conditions.push(lte(tickets.createdAt, endDate));

    // Get all incidents in date range
    const incidents = await db.select().from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt));

    // Calculate metrics
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(t => ['Resolved', 'Closed'].includes(t.status!));
    const openIncidents = incidents.filter(t => ['Open', 'In Progress'].includes(t.status!));

    // Calculate MTTR (Mean Time To Resolution) in hours
    const mttr = resolvedIncidents
      .filter(t => t.resolvedAt)
      .reduce((acc, ticket) => {
        const created = new Date(ticket.createdAt!);
        const resolved = new Date(ticket.resolvedAt!);
        return acc + ((resolved.getTime() - created.getTime()) / (1000 * 60 * 60));
      }, 0) / Math.max(resolvedIncidents.length, 1);

    // Group by priority
    const incidentsByPriority = incidents.reduce((acc: Record<string, number>, ticket) => {
      acc[ticket.priority!] = (acc[ticket.priority!] || 0) + 1;
      return acc;
    }, {});

    // Group by status
    const incidentsByStatus = incidents.reduce((acc: Record<string, number>, ticket) => {
      acc[ticket.status!] = (acc[ticket.status!] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalIncidents,
        openIncidents: openIncidents.length,
        resolvedIncidents: resolvedIncidents.length,
        resolutionRate: (resolvedIncidents.length / Math.max(totalIncidents, 1) * 100).toFixed(2),
        mttr: mttr.toFixed(2)
      },
      distribution: {
        byPriority: incidentsByPriority,
        byStatus: incidentsByStatus
      },
      trends: incidents.slice(0, 20) // Recent 20 incidents for trending
    };
  }

  async getProblemReport(startDate?: Date, endDate?: Date): Promise<any> {
    const conditions = [eq(tickets.type, 'Problem')];
    if (startDate) conditions.push(gte(tickets.createdAt, startDate));
    if (endDate) conditions.push(lte(tickets.createdAt, endDate));

    const problems = await db.select().from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt));

    const totalProblems = problems.length;
    const resolvedProblems = problems.filter(t => ['Resolved', 'Closed'].includes(t.status!));
    const activeProblems = problems.filter(t => !['Resolved', 'Closed'].includes(t.status!));

    return {
      summary: {
        totalProblems,
        activeProblems: activeProblems.length,
        resolvedProblems: resolvedProblems.length,
        resolutionRate: (resolvedProblems.length / Math.max(totalProblems, 1) * 100).toFixed(2)
      },
      problemsByStatus: problems.reduce((acc: Record<string, number>, ticket) => {
        acc[ticket.status!] = (acc[ticket.status!] || 0) + 1;
        return acc;
      }, {}),
      recentProblems: problems.slice(0, 10)
    };
  }

  async getChangeReport(startDate?: Date, endDate?: Date): Promise<any> {
    const conditions = [eq(tickets.type, 'Change')];
    if (startDate) conditions.push(gte(tickets.createdAt, startDate));
    if (endDate) conditions.push(lte(tickets.createdAt, endDate));

    const changes = await db.select().from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt));

    const totalChanges = changes.length;
    const successfulChanges = changes.filter(t => t.status === 'Closed');
    const failedChanges = changes.filter(t => t.status === 'Cancelled');
    const pendingChanges = changes.filter(t => ['Open', 'In Progress'].includes(t.status!));

    const successRate = (successfulChanges.length / Math.max(totalChanges, 1) * 100).toFixed(2);

    return {
      summary: {
        totalChanges,
        successfulChanges: successfulChanges.length,
        failedChanges: failedChanges.length,
        pendingChanges: pendingChanges.length,
        successRate
      },
      changesByPriority: changes.reduce((acc: Record<string, number>, ticket) => {
        acc[ticket.priority!] = (acc[ticket.priority!] || 0) + 1;
        return acc;
      }, {}),
      recentChanges: changes.slice(0, 10)
    };
  }

  async getSLAReport(startDate?: Date, endDate?: Date): Promise<any> {
    let slaQuery = db.select().from(slaMetrics);
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) conditions.push(gte(slaMetrics.createdAt, startDate));
      if (endDate) conditions.push(lte(slaMetrics.createdAt, endDate));
      slaQuery = slaQuery.where(and(...conditions));
    }

    const slaData = await slaQuery.orderBy(desc(slaMetrics.createdAt));
    
    const totalSLAs = slaData.length;
    const breachedSLAs = slaData.filter(s => s.breached === 'true');
    const metSLAs = totalSLAs - breachedSLAs.length;

    // Calculate SLA compliance percentage
    const complianceRate = (metSLAs / Math.max(totalSLAs, 1) * 100).toFixed(2);

    // Group by escalation level
    const slaByEscalation = slaData.reduce((acc: Record<string, number>, sla) => {
      acc[sla.escalationLevel!] = (acc[sla.escalationLevel!] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalSLAs,
        metSLAs,
        breachedSLAs: breachedSLAs.length,
        complianceRate,
        breachRate: (breachedSLAs.length / Math.max(totalSLAs, 1) * 100).toFixed(2)
      },
      slaByEscalation,
      recentBreaches: breachedSLAs.slice(0, 10)
    };
  }

  async getCMDBReport(): Promise<any> {
    const allCIs = await db.select().from(configurationItems);
    const allRelationships = await db.select().from(ciRelationships);

    // Group CIs by type
    const cisByType = allCIs.reduce((acc: Record<string, number>, ci) => {
      acc[ci.type!] = (acc[ci.type!] || 0) + 1;
      return acc;
    }, {});

    // Group CIs by status
    const cisByStatus = allCIs.reduce((acc: Record<string, number>, ci) => {
      acc[ci.status!] = (acc[ci.status!] || 0) + 1;
      return acc;
    }, {});

    // Group CIs by environment
    const cisByEnvironment = allCIs.reduce((acc: Record<string, number>, ci) => {
      const env = ci.environment || 'Unknown';
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalCIs: allCIs.length,
        activeCIs: allCIs.filter(ci => ci.status === 'Active').length,
        inactiveCIs: allCIs.filter(ci => ci.status === 'Inactive').length,
        maintenanceCIs: allCIs.filter(ci => ci.status === 'Maintenance').length,
        totalRelationships: allRelationships.length
      },
      distribution: {
        byType: cisByType,
        byStatus: cisByStatus,
        byEnvironment: cisByEnvironment
      },
      relationships: {
        total: allRelationships.length,
        byType: allRelationships.reduce((acc: Record<string, number>, rel) => {
          acc[rel.relationshipType!] = (acc[rel.relationshipType!] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  async getServiceAvailabilityReport(startDate?: Date, endDate?: Date): Promise<any> {
    // Service availability calculated based on incidents affecting services
    const conditions = [eq(tickets.type, 'Incident')];
    if (startDate) conditions.push(gte(tickets.createdAt, startDate));
    if (endDate) conditions.push(lte(tickets.createdAt, endDate));

    const serviceIncidents = await db.select().from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt));

    // Get affected services (from CI relationships)
    const affectedServices = await db.select().from(configurationItems)
      .where(eq(configurationItems.type, 'Application'));

    // Calculate uptime percentage (simplified calculation)
    const totalHours = startDate && endDate 
      ? (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) 
      : 24 * 30; // Default to 30 days

    const criticalIncidents = serviceIncidents.filter(i => i.priority === 'Critical');
    const majorIncidents = serviceIncidents.filter(i => i.priority === 'High');

    // Estimate downtime (simplified: Critical = 2hrs avg, High = 1hr avg)
    const estimatedDowntime = (criticalIncidents.length * 2) + (majorIncidents.length * 1);
    const uptimePercentage = ((totalHours - estimatedDowntime) / totalHours * 100).toFixed(3);

    return {
      summary: {
        uptimePercentage,
        totalIncidents: serviceIncidents.length,
        criticalIncidents: criticalIncidents.length,
        majorIncidents: majorIncidents.length,
        estimatedDowntimeHours: estimatedDowntime,
        affectedServices: affectedServices.length
      },
      incidentImpact: {
        critical: criticalIncidents.length,
        high: majorIncidents.length,
        medium: serviceIncidents.filter(i => i.priority === 'Medium').length,
        low: serviceIncidents.filter(i => i.priority === 'Low').length
      },
      recentIncidents: serviceIncidents.slice(0, 10)
    };
  }
}

export const storage = new DatabaseStorage();
