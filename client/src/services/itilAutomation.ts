// ITIL Automation Service Layer
export interface AutomationRule {
  id: string;
  name: string;
  type: 'assignment' | 'escalation' | 'linking' | 'closure';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  enabled: boolean;
}

export interface MonitoringAlert {
  id: string;
  source: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  ciId: string;
  timestamp: Date;
  metrics?: Record<string, number>;
}

export interface SLAThreshold {
  severity: string;
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  escalationTime: number; // minutes
}

export interface AssignmentMatrix {
  severity: string;
  ciType: string;
  location: string;
  assignedGroup: string;
  escalationGroup: string;
}

export class ITILAutomationService {
  private static instance: ITILAutomationService;
  private automationRules: AutomationRule[] = [];
  private slaThresholds: SLAThreshold[] = [
    { severity: 'Critical', responseTime: 15, resolutionTime: 240, escalationTime: 60 },
    { severity: 'High', responseTime: 30, resolutionTime: 480, escalationTime: 120 },
    { severity: 'Medium', responseTime: 60, resolutionTime: 1440, escalationTime: 240 },
    { severity: 'Low', responseTime: 240, resolutionTime: 2880, escalationTime: 480 }
  ];

  private assignmentMatrix: AssignmentMatrix[] = [
    { severity: 'Critical', ciType: 'Database', location: 'DC-HCM-01', assignedGroup: 'L1-Database', escalationGroup: 'L3-Database-Expert' },
    { severity: 'Critical', ciType: 'Server', location: 'DC-HCM-01', assignedGroup: 'L1-Infrastructure', escalationGroup: 'L2-Infrastructure' },
    { severity: 'Critical', ciType: 'Service', location: 'Cloud-AWS', assignedGroup: 'L1-Application', escalationGroup: 'L3-Application-Expert' },
    { severity: 'High', ciType: 'Database', location: 'DC-HCM-01', assignedGroup: 'L1-Database', escalationGroup: 'L2-Database' },
    { severity: 'High', ciType: 'Server', location: 'DC-HCM-01', assignedGroup: 'L1-Infrastructure', escalationGroup: 'L2-Infrastructure' },
    { severity: 'High', ciType: 'Service', location: 'Cloud-AWS', assignedGroup: 'L1-Application', escalationGroup: 'L2-Application' },
    { severity: 'Medium', ciType: '*', location: '*', assignedGroup: 'L1-General', escalationGroup: 'L2-General' },
    { severity: 'Low', ciType: '*', location: '*', assignedGroup: 'L1-General', escalationGroup: 'L2-General' }
  ];

  public static getInstance(): ITILAutomationService {
    if (!ITILAutomationService.instance) {
      ITILAutomationService.instance = new ITILAutomationService();
    }
    return ITILAutomationService.instance;
  }

  // 1. Auto-assign incidents from monitoring alerts
  public processMonitoringAlert(alert: MonitoringAlert, ciDetails: any): any {
    console.log(`Processing monitoring alert: ${alert.id} for CI: ${alert.ciId}`);
    
    const assignment = this.getAssignment(alert.severity, ciDetails.type, ciDetails.location);
    const sla = this.getSLAThreshold(alert.severity);
    
    const incident = {
      id: `inc-${Date.now()}`,
      title: `${alert.source}: ${alert.message}`,
      description: `Automated incident from monitoring alert\nCI: ${ciDetails.name}\nSeverity: ${alert.severity}\nMetrics: ${JSON.stringify(alert.metrics)}`,
      severity: alert.severity,
      status: 'Open',
      assignedGroup: assignment.assignedGroup,
      ciId: alert.ciId,
      ciName: ciDetails.name,
      createdAt: new Date(),
      slaResponseTime: sla.responseTime,
      slaResolutionTime: sla.resolutionTime,
      escalationTime: sla.escalationTime,
      sourceAlert: alert.id
    };

    // Auto-assign based on rules
    this.executeAssignmentRules(incident);
    
    return incident;
  }

  // 2. SLA monitoring and escalation
  public checkSLAViolations(incidents: any[]): any[] {
    const violations: any[] = [];
    const now = new Date();

    incidents.forEach(incident => {
      if (incident.status === 'Closed') return;

      const createdTime = new Date(incident.createdAt);
      const elapsedMinutes = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60));
      
      const sla = this.getSLAThreshold(incident.severity);
      
      if (elapsedMinutes >= sla.escalationTime && !incident.escalated) {
        violations.push({
          incidentId: incident.id,
          type: 'escalation_required',
          elapsedTime: elapsedMinutes,
          threshold: sla.escalationTime,
          recommendedAction: 'escalate'
        });
      }
      
      if (elapsedMinutes >= sla.responseTime && incident.status === 'Open') {
        violations.push({
          incidentId: incident.id,
          type: 'response_overdue',
          elapsedTime: elapsedMinutes,
          threshold: sla.responseTime,
          recommendedAction: 'notify_manager'
        });
      }
    });

    return violations;
  }

  // 3. Automatic escalation
  public escalateIncident(incident: any): any {
    const assignment = this.assignmentMatrix.find(am => 
      (am.severity === incident.severity || am.severity === '*') &&
      (am.ciType === incident.ciType || am.ciType === '*') &&
      (am.location === incident.location || am.location === '*')
    );

    const escalatedIncident = {
      ...incident,
      assignedGroup: assignment?.escalationGroup || 'L3-Expert',
      escalated: true,
      escalationTime: new Date(),
      escalationReason: 'SLA threshold breach'
    };

    console.log(`Escalating incident ${incident.id} to ${escalatedIncident.assignedGroup}`);
    return escalatedIncident;
  }

  // 4. Link multiple incidents to problem
  public analyzeIncidentPatterns(incidents: any[]): any[] {
    const patterns: any[] = [];
    const ciGroups: Record<string, any[]> = {};

    // Group incidents by CI
    incidents.forEach(incident => {
      if (incident.status !== 'Closed') {
        if (!ciGroups[incident.ciId]) {
          ciGroups[incident.ciId] = [];
        }
        ciGroups[incident.ciId].push(incident);
      }
    });

    // Find CIs with multiple incidents
    Object.entries(ciGroups).forEach(([ciId, ciIncidents]) => {
      if (ciIncidents.length >= 2) {
        const timeWindow = 4 * 60 * 60 * 1000; // 4 hours
        const now = new Date().getTime();
        
        const recentIncidents = ciIncidents.filter(inc => 
          now - new Date(inc.createdAt).getTime() < timeWindow
        );

        if (recentIncidents.length >= 2) {
          patterns.push({
            type: 'multiple_incidents_same_ci',
            ciId: ciId,
            incidentIds: recentIncidents.map(inc => inc.id),
            count: recentIncidents.length,
            recommendation: 'create_problem_record',
            severity: this.getHighestSeverity(recentIncidents)
          });
        }
      }
    });

    return patterns;
  }

  // 5. Create problem from incident pattern
  public createProblemFromPattern(pattern: any, ciDetails: any): any {
    const problem = {
      id: `prb-${Date.now()}`,
      title: `Multiple incidents affecting ${ciDetails.name}`,
      description: `Problem record created due to ${pattern.count} incidents on the same CI within 4 hours`,
      status: 'Investigation',
      priority: pattern.severity,
      linkedIncidents: pattern.incidentIds,
      ciId: pattern.ciId,
      ciName: ciDetails.name,
      createdAt: new Date(),
      assignedGroup: this.getProblemAssignmentGroup(pattern.severity, ciDetails.type),
      rootCauseAnalysisRequired: true
    };

    console.log(`Created problem ${problem.id} linking ${pattern.incidentIds.length} incidents`);
    return problem;
  }

  // 6. Create change from problem after RCA
  public createChangeFromProblem(problem: any, rcaDetails: any): any {
    const change = {
      id: `chg-${Date.now()}`,
      title: `Remediation for ${problem.title}`,
      description: `Change request to address root cause identified in problem ${problem.id}\n\nRoot Cause: ${rcaDetails.rootCause}\nProposed Solution: ${rcaDetails.solution}`,
      status: 'Planning',
      priority: problem.priority,
      linkedProblem: problem.id,
      linkedIncidents: problem.linkedIncidents,
      ciId: problem.ciId,
      ciName: problem.ciName,
      createdAt: new Date(),
      plannedImplementation: rcaDetails.implementationDate,
      riskAssessment: rcaDetails.riskLevel || 'Medium',
      rollbackPlan: rcaDetails.rollbackPlan,
      assignedGroup: this.getChangeAssignmentGroup(problem.ciType, rcaDetails.changeType)
    };

    console.log(`Created change ${change.id} from problem ${problem.id}`);
    return change;
  }

  // 7. Sync close related tickets when change completed
  public syncCloseRelatedTickets(change: any): any {
    const closureResult = {
      changeId: change.id,
      closedIncidents: [],
      closedProblems: [],
      updatedCIs: [],
      completionTime: new Date()
    };

    // Mark change as closed
    const closedChange = {
      ...change,
      status: 'Closed',
      completionDate: new Date(),
      closureNotes: 'Change implemented successfully, related incidents and problems closed automatically'
    };

    console.log(`Sync closing all tickets related to change ${change.id}`);
    
    // This would integrate with ticket system APIs to actually close tickets
    closureResult.closedIncidents = change.linkedIncidents || [];
    if (change.linkedProblem) {
      closureResult.closedProblems = [change.linkedProblem];
    }
    closureResult.updatedCIs = [change.ciId];

    return { closedChange, closureResult };
  }

  // 8. CI relationship and impact analysis
  public analyzeCIImpact(ciId: string, cis: any[], incidents: any[], problems: any[], changes: any[]): any {
    const ci = cis.find(c => c.id === ciId);
    if (!ci) return null;

    const relatedIncidents = incidents.filter(inc => inc.ciId === ciId);
    const relatedProblems = problems.filter(prb => prb.ciId === ciId);
    const relatedChanges = changes.filter(chg => chg.ciId === ciId);

    // Find dependent CIs
    const dependentCIs = cis.filter(c => c.dependencies?.includes(ciId));
    const dependencyCIs = ci.dependencies?.map(depId => cis.find(c => c.id === depId)).filter(Boolean) || [];

    return {
      ci: ci,
      directImpact: {
        incidents: relatedIncidents.length,
        problems: relatedProblems.length,
        changes: relatedChanges.length,
        openIssues: relatedIncidents.filter(inc => inc.status !== 'Closed').length
      },
      relationships: {
        dependentCIs: dependentCIs.map(ci => ({ id: ci.id, name: ci.name, type: ci.type })),
        dependencyCIs: dependencyCIs.map(ci => ({ id: ci.id, name: ci.name, type: ci.type }))
      },
      riskAssessment: this.calculateCIRisk(ci, relatedIncidents, dependentCIs.length),
      recommendations: this.generateCIRecommendations(ci, relatedIncidents, relatedProblems)
    };
  }

  // Helper methods
  private getAssignment(severity: string, ciType: string, location: string): AssignmentMatrix {
    return this.assignmentMatrix.find(am => 
      am.severity === severity && 
      (am.ciType === ciType || am.ciType === '*') &&
      (am.location === location || am.location === '*')
    ) || this.assignmentMatrix.find(am => am.severity === '*') || this.assignmentMatrix[0];
  }

  private getSLAThreshold(severity: string): SLAThreshold {
    return this.slaThresholds.find(sla => sla.severity === severity) || this.slaThresholds[3];
  }

  private executeAssignmentRules(incident: any): void {
    // Apply custom assignment rules
    console.log(`Auto-assigned incident ${incident.id} to ${incident.assignedGroup}`);
  }

  private getHighestSeverity(incidents: any[]): string {
    const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
    for (const severity of severityOrder) {
      if (incidents.some(inc => inc.severity === severity)) {
        return severity;
      }
    }
    return 'Low';
  }

  private getProblemAssignmentGroup(severity: string, ciType: string): string {
    if (severity === 'Critical') return `L3-${ciType}-Expert`;
    if (severity === 'High') return `L2-${ciType}-Analysis`;
    return 'L2-Problem-Management';
  }

  private getChangeAssignmentGroup(ciType: string, changeType: string): string {
    return `Change-${ciType}-Team`;
  }

  private calculateCIRisk(ci: any, incidents: any[], dependentCount: number): string {
    const openIncidents = incidents.filter(inc => inc.status !== 'Closed').length;
    const criticalIncidents = incidents.filter(inc => inc.severity === 'Critical').length;
    
    if (criticalIncidents > 0 || (openIncidents > 2 && dependentCount > 3)) return 'High';
    if (openIncidents > 1 || dependentCount > 1) return 'Medium';
    return 'Low';
  }

  private generateCIRecommendations(ci: any, incidents: any[], problems: any[]): string[] {
    const recommendations: string[] = [];
    
    if (incidents.filter(inc => inc.status !== 'Closed').length > 2) {
      recommendations.push('Consider creating a problem record for recurring incidents');
    }
    
    if (ci.status === 'Degraded') {
      recommendations.push('Schedule maintenance window to address performance issues');
    }
    
    if (problems.filter(prb => prb.status === 'Investigation').length > 0) {
      recommendations.push('Prioritize root cause analysis for open problems');
    }
    
    return recommendations;
  }
}

export const automationService = ITILAutomationService.getInstance();

