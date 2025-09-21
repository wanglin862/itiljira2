// JIRA Integration Service for CMDB and Ticket Data
export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
  cmdbProjectKey?: string;
}

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: {
    name: string;
    statusCategory: {
      key: string;
      name: string;
    };
  };
  priority: {
    name: string;
    iconUrl: string;
  };
  issueType: {
    name: string;
    iconUrl: string;
  };
  assignee?: {
    displayName: string;
    emailAddress: string;
    accountId: string;
  };
  reporter: {
    displayName: string;
    emailAddress: string;
    accountId: string;
  };
  created: string;
  updated: string;
  resolutiondate?: string;
  components: Array<{
    name: string;
    description: string;
  }>;
  labels: string[];
  customFields: Record<string, any>;
  // ITIL specific fields
  affectedCI?: string[];
  impact?: string;
  urgency?: string;
  category?: string;
  subcategory?: string;
}

export interface JiraCMDBItem {
  id: string;
  key: string;
  name: string;
  ciType: string;
  status: string;
  location?: string;
  owner?: string;
  environment?: string;
  ipAddress?: string;
  hostname?: string;
  operatingSystem?: string;
  businessService?: string;
  dependencies: string[];
  supportGroup?: string;
  vendor?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  warrantyExpiry?: string;
  costCenter?: string;
  customFields: Record<string, any>;
  relatedTickets: string[];
  lastUpdated: string;
}

export interface JiraSearchResult<T> {
  issues: T[];
  total: number;
  startAt: number;
  maxResults: number;
}

export class JiraIntegrationService {
  private config: JiraConfig;
  private baseHeaders: HeadersInit;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseHeaders = {
      'Authorization': `Basic ${btoa(`${config.username}:${config.apiToken}`)}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // Generic JIRA API request method
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}/rest/api/3/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`JIRA API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get tickets with ITIL fields
  async getTickets(jql: string = '', startAt: number = 0, maxResults: number = 50): Promise<JiraSearchResult<JiraTicket>> {
    const defaultJql = `project = ${this.config.projectKey} ORDER BY created DESC`;
    const searchJql = jql || defaultJql;

    const searchParams = new URLSearchParams({
      jql: searchJql,
      startAt: startAt.toString(),
      maxResults: maxResults.toString(),
      expand: 'names,schema,operations,editmeta,changelog,renderedFields',
      fields: [
        'summary',
        'description', 
        'status',
        'priority',
        'issuetype',
        'assignee',
        'reporter',
        'created',
        'updated',
        'resolutiondate',
        'components',
        'labels',
        // Custom ITIL fields - adjust based on your JIRA configuration
        'customfield_10001', // Affected CI
        'customfield_10002', // Impact
        'customfield_10003', // Urgency
        'customfield_10004', // Category
        'customfield_10005', // Subcategory
        'customfield_10006', // Root Cause
        'customfield_10007', // Resolution Details
      ].join(',')
    });

    const result = await this.makeRequest<any>(`search?${searchParams}`);
    
    return {
      issues: result.issues.map(this.transformJiraIssueToTicket),
      total: result.total,
      startAt: result.startAt,
      maxResults: result.maxResults
    };
  }

  // Get specific ticket by key
  async getTicket(ticketKey: string): Promise<JiraTicket> {
    const issue = await this.makeRequest<any>(`issue/${ticketKey}?expand=names,schema,operations,editmeta,changelog,renderedFields`);
    return this.transformJiraIssueToTicket(issue);
  }

  // Get CMDB items (assuming they're stored as JIRA issues in a separate project)
  async getCMDBItems(jql: string = '', startAt: number = 0, maxResults: number = 100): Promise<JiraSearchResult<JiraCMDBItem>> {
    const cmdbProject = this.config.cmdbProjectKey || `${this.config.projectKey}-CMDB`;
    const defaultJql = `project = ${cmdbProject} AND issuetype = "Configuration Item" ORDER BY created DESC`;
    const searchJql = jql || defaultJql;

    const searchParams = new URLSearchParams({
      jql: searchJql,
      startAt: startAt.toString(),
      maxResults: maxResults.toString(),
      expand: 'names,schema,operations,editmeta,changelog,renderedFields',
      fields: [
        'summary',
        'description',
        'status',
        'components',
        'labels',
        'created',
        'updated',
        // CMDB specific custom fields
        'customfield_11001', // CI Type
        'customfield_11002', // Location
        'customfield_11003', // Owner
        'customfield_11004', // Environment
        'customfield_11005', // IP Address
        'customfield_11006', // Hostname
        'customfield_11007', // Operating System
        'customfield_11008', // Business Service
        'customfield_11009', // Dependencies
        'customfield_11010', // Support Group
        'customfield_11011', // Vendor
        'customfield_11012', // Model
        'customfield_11013', // Serial Number
        'customfield_11014', // Install Date
        'customfield_11015', // Warranty Expiry
        'customfield_11016', // Cost Center
      ].join(',')
    });

    const result = await this.makeRequest<any>(`search?${searchParams}`);
    
    return {
      issues: result.issues.map(this.transformJiraIssueToCMDBItem),
      total: result.total,
      startAt: result.startAt,
      maxResults: result.maxResults
    };
  }

  // Get specific CMDB item
  async getCMDBItem(ciKey: string): Promise<JiraCMDBItem> {
    const issue = await this.makeRequest<any>(`issue/${ciKey}?expand=names,schema,operations,editmeta,changelog,renderedFields`);
    return this.transformJiraIssueToCMDBItem(issue);
  }

  // Get tickets related to a specific CI
  async getTicketsForCI(ciKey: string): Promise<JiraTicket[]> {
    const jql = `"Affected CI" ~ "${ciKey}" OR description ~ "${ciKey}" OR summary ~ "${ciKey}" ORDER BY created DESC`;
    const result = await this.getTickets(jql, 0, 100);
    return result.issues;
  }

  // Get CI dependencies
  async getCIDependencies(ciKey: string): Promise<JiraCMDBItem[]> {
    const ci = await this.getCMDBItem(ciKey);
    const dependencyKeys = ci.dependencies;
    
    if (dependencyKeys.length === 0) {
      return [];
    }

    const jql = `key IN (${dependencyKeys.map(key => `"${key}"`).join(',')})`;
    const result = await this.getCMDBItems(jql);
    return result.issues;
  }

  // Create incident ticket
  async createIncident(incidentData: {
    summary: string;
    description: string;
    priority: string;
    affectedCI?: string[];
    impact?: string;
    urgency?: string;
    category?: string;
    reporter?: string;
  }): Promise<JiraTicket> {
    const issueData = {
      fields: {
        project: { key: this.config.projectKey },
        issuetype: { name: 'Incident' },
        summary: incidentData.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: incidentData.description
            }]
          }]
        },
        priority: { name: incidentData.priority },
        // Map custom fields based on your JIRA configuration
        customfield_10001: incidentData.affectedCI, // Affected CI
        customfield_10002: { value: incidentData.impact }, // Impact
        customfield_10003: { value: incidentData.urgency }, // Urgency
        customfield_10004: { value: incidentData.category }, // Category
      }
    };

    const result = await this.makeRequest<any>('issue', {
      method: 'POST',
      body: JSON.stringify(issueData)
    });

    return this.getTicket(result.key);
  }

  // Create change request
  async createChangeRequest(changeData: {
    summary: string;
    description: string;
    priority: string;
    changeType: string;
    affectedCI?: string[];
    implementationPlan?: string;
    backoutPlan?: string;
    riskLevel?: string;
    plannedStart?: string;
    plannedEnd?: string;
  }): Promise<JiraTicket> {
    const issueData = {
      fields: {
        project: { key: this.config.projectKey },
        issuetype: { name: 'Change Request' },
        summary: changeData.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: changeData.description
            }]
          }]
        },
        priority: { name: changeData.priority },
        // Map custom fields for change management
        customfield_10020: { value: changeData.changeType }, // Change Type
        customfield_10001: changeData.affectedCI, // Affected CI
        customfield_10021: changeData.implementationPlan, // Implementation Plan
        customfield_10022: changeData.backoutPlan, // Backout Plan
        customfield_10023: { value: changeData.riskLevel }, // Risk Level
        customfield_10024: changeData.plannedStart, // Planned Start
        customfield_10025: changeData.plannedEnd, // Planned End
      }
    };

    const result = await this.makeRequest<any>('issue', {
      method: 'POST',
      body: JSON.stringify(issueData)
    });

    return this.getTicket(result.key);
  }

  // Update ticket
  async updateTicket(ticketKey: string, updateData: Record<string, any>): Promise<JiraTicket> {
    const issueData = {
      fields: updateData
    };

    await this.makeRequest(`issue/${ticketKey}`, {
      method: 'PUT',
      body: JSON.stringify(issueData)
    });

    return this.getTicket(ticketKey);
  }

  // Add comment to ticket
  async addComment(ticketKey: string, comment: string): Promise<void> {
    const commentData = {
      body: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: comment
          }]
        }]
      }
    };

    await this.makeRequest(`issue/${ticketKey}/comment`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }

  // Get ticket transitions (for status changes)
  async getTicketTransitions(ticketKey: string): Promise<Array<{id: string, name: string}>> {
    const result = await this.makeRequest<any>(`issue/${ticketKey}/transitions`);
    return result.transitions.map((t: any) => ({
      id: t.id,
      name: t.name
    }));
  }

  // Transition ticket status
  async transitionTicket(ticketKey: string, transitionId: string, comment?: string): Promise<void> {
    const transitionData: any = {
      transition: { id: transitionId }
    };

    if (comment) {
      transitionData.update = {
        comment: [{
          add: {
            body: {
              type: 'doc',
              version: 1,
              content: [{
                type: 'paragraph',
                content: [{
                  type: 'text',
                  text: comment
                }]
              }]
            }
          }
        }]
      };
    }

    await this.makeRequest(`issue/${ticketKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify(transitionData)
    });
  }

  // Get dashboard data
  async getDashboardData(): Promise<{
    totalTickets: number;
    openTickets: number;
    totalCIs: number;
    recentTickets: JiraTicket[];
    recentCIs: JiraCMDBItem[];
    ticketsByStatus: Record<string, number>;
    ticketsByPriority: Record<string, number>;
  }> {
    const [ticketsResult, cmdbResult] = await Promise.all([
      this.getTickets('', 0, 100),
      this.getCMDBItems('', 0, 100)
    ]);

    const openTickets = ticketsResult.issues.filter(t => 
      t.status.statusCategory.key !== 'done'
    ).length;

    const ticketsByStatus = ticketsResult.issues.reduce((acc, ticket) => {
      acc[ticket.status.name] = (acc[ticket.status.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ticketsByPriority = ticketsResult.issues.reduce((acc, ticket) => {
      acc[ticket.priority.name] = (acc[ticket.priority.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTickets: ticketsResult.total,
      openTickets,
      totalCIs: cmdbResult.total,
      recentTickets: ticketsResult.issues.slice(0, 10),
      recentCIs: cmdbResult.issues.slice(0, 10),
      ticketsByStatus,
      ticketsByPriority
    };
  }

  // Transform JIRA issue to ticket format
  private transformJiraIssueToTicket(issue: any): JiraTicket {
    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || issue.fields.description || '',
      status: issue.fields.status,
      priority: issue.fields.priority,
      issueType: issue.fields.issuetype,
      assignee: issue.fields.assignee,
      reporter: issue.fields.reporter,
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolutiondate: issue.fields.resolutiondate,
      components: issue.fields.components || [],
      labels: issue.fields.labels || [],
      customFields: {
        affectedCI: issue.fields.customfield_10001,
        impact: issue.fields.customfield_10002?.value,
        urgency: issue.fields.customfield_10003?.value,
        category: issue.fields.customfield_10004?.value,
        subcategory: issue.fields.customfield_10005?.value,
        rootCause: issue.fields.customfield_10006,
        resolutionDetails: issue.fields.customfield_10007,
      },
      affectedCI: issue.fields.customfield_10001 || [],
      impact: issue.fields.customfield_10002?.value,
      urgency: issue.fields.customfield_10003?.value,
      category: issue.fields.customfield_10004?.value,
      subcategory: issue.fields.customfield_10005?.value,
    };
  }

  // Transform JIRA issue to CMDB item format
  private transformJiraIssueToCMDBItem(issue: any): JiraCMDBItem {
    return {
      id: issue.id,
      key: issue.key,
      name: issue.fields.summary,
      ciType: issue.fields.customfield_11001?.value || 'Unknown',
      status: issue.fields.status.name,
      location: issue.fields.customfield_11002?.value,
      owner: issue.fields.customfield_11003?.value,
      environment: issue.fields.customfield_11004?.value,
      ipAddress: issue.fields.customfield_11005,
      hostname: issue.fields.customfield_11006,
      operatingSystem: issue.fields.customfield_11007?.value,
      businessService: issue.fields.customfield_11008?.value,
      dependencies: issue.fields.customfield_11009 || [],
      supportGroup: issue.fields.customfield_11010?.value,
      vendor: issue.fields.customfield_11011?.value,
      model: issue.fields.customfield_11012,
      serialNumber: issue.fields.customfield_11013,
      installDate: issue.fields.customfield_11014,
      warrantyExpiry: issue.fields.customfield_11015,
      costCenter: issue.fields.customfield_11016?.value,
      customFields: {
        ciType: issue.fields.customfield_11001,
        location: issue.fields.customfield_11002,
        owner: issue.fields.customfield_11003,
        environment: issue.fields.customfield_11004,
        supportGroup: issue.fields.customfield_11010,
        vendor: issue.fields.customfield_11011,
        costCenter: issue.fields.customfield_11016,
      },
      relatedTickets: [], // This would need a separate query
      lastUpdated: issue.fields.updated,
    };
  }
}

// Singleton instance
let jiraService: JiraIntegrationService | null = null;

export const initializeJiraService = (config: JiraConfig): JiraIntegrationService => {
  jiraService = new JiraIntegrationService(config);
  return jiraService;
};

export const getJiraService = (): JiraIntegrationService => {
  if (!jiraService) {
    throw new Error('JIRA service not initialized. Call initializeJiraService first.');
  }
  return jiraService;
};
