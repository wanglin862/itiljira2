import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const configurationItems = pgTable("configuration_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // VM, Server, Network, Database, etc.
  status: text("status").notNull().default("Active"), // Active, Inactive, Maintenance
  location: text("location"),
  ipAddress: text("ip_address"),
  hostname: text("hostname"),
  operatingSystem: text("operating_system"),
  environment: text("environment"), // Production, Staging, Development
  businessService: text("business_service"),
  owner: text("owner"),
  metadata: jsonb("metadata"), // Additional flexible data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jiraKey: text("jira_key").notNull().unique(),
  type: text("type").notNull(), // Incident, Problem, Change
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  assignee: text("assignee"),
  reporter: text("reporter"),
  ciId: varchar("ci_id").references(() => configurationItems.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const ciRelationships = pgTable("ci_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => configurationItems.id),
  targetId: varchar("target_id").notNull().references(() => configurationItems.id),
  relationshipType: text("relationship_type").notNull(), // depends_on, contains, connects_to
  createdAt: timestamp("created_at").defaultNow(),
});

export const slaMetrics = pgTable("sla_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id),
  targetResolutionTime: text("target_resolution_time").notNull(),
  actualResolutionTime: text("actual_resolution_time"),
  breached: text("breached").notNull().default("false"),
  escalationLevel: text("escalation_level").notNull().default("L1"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCISchema = createInsertSchema(configurationItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCIRelationshipSchema = createInsertSchema(ciRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertSLAMetricSchema = createInsertSchema(slaMetrics).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConfigurationItem = typeof configurationItems.$inferSelect;
export type InsertCI = z.infer<typeof insertCISchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type CIRelationship = typeof ciRelationships.$inferSelect;
export type InsertCIRelationship = z.infer<typeof insertCIRelationshipSchema>;
export type SLAMetric = typeof slaMetrics.$inferSelect;
export type InsertSLAMetric = z.infer<typeof insertSLAMetricSchema>;

// Enums for form validation
export const ciTypes = ["VM", "Server", "Network", "Database", "Application", "Storage"] as const;
export const ciStatuses = ["Active", "Inactive", "Maintenance", "Decommissioned"] as const;
export const ticketTypes = ["Incident", "Problem", "Change"] as const;
export const ticketStatuses = ["Open", "In Progress", "Resolved", "Closed", "Cancelled"] as const;
export const ticketPriorities = ["Critical", "High", "Medium", "Low"] as const;
export const environments = ["Production", "Staging", "Development", "Testing"] as const;
export const relationshipTypes = ["depends_on", "contains", "connects_to", "hosted_on"] as const;