package com.example.itil.workflow;

import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.workflow.function.issue.AbstractJiraFunctionProvider;
import com.opensymphony.workflow.WorkflowException;
import com.atlassian.jira.issue.link.IssueLink;
import com.atlassian.jira.bc.issue.IssueService;
import java.util.Map;

public class CloseRelatedIssuesPostFunction extends AbstractJiraFunctionProvider {
    @Override
    public void execute(Map transientVars, Map args, com.opensymphony.module.propertyset.PropertySet ps) throws WorkflowException {
        Issue change = getIssue(transientVars);
        // For each linked issue (incoming/outgoing) that is Incident/Problem -> transition to Closed
        ComponentAccessor.getIssueLinkManager().getOutwardLinks(change.getId()).forEach(link -> {
            Issue dest = link.getDestinationObject();
            String type = dest.getIssueType().getName();
            if ("Incident".equalsIgnoreCase(type) || "Problem".equalsIgnoreCase(type)) {
                try {
                    transitionIssueToStatus(dest, "Done"); // you may use actual transition id
                } catch (Exception e) {
                    // log
                }
            }
        });
    }

    private void transitionIssueToStatus(Issue issue, String targetStatusName) {
        IssueService issueService = ComponentAccessor.getIssueService();
        ApplicationUser user = ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser();
        // This method is simplified: proper implementation should find transition id then validate & execute
        // For production use, map the action id for "Close" and call issueService.validateTransition(...)
    }
}

