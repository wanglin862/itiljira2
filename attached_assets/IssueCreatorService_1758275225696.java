package com.example.itil.service;

import com.atlassian.jira.bc.issue.IssueService;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.IssueInputParameters;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.issue.Issue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.inject.Named;

@Named
public class IssueCreatorService {
    private static final Logger log = LoggerFactory.getLogger(IssueCreatorService.class);
    private final IssueService issueService = ComponentAccessor.getIssueService();

    // create Incident, return issue id
    public Long createIncident(String summary, String description, String ciValue, String service) {
        ApplicationUser user = getAutomationUser();
        IssueInputParameters params = issueService.newIssueInputParameters();
        params.setProjectKey("ITSM")
              .setIssueTypeId(getIssueTypeIdByName("Incident"))
              .setSummary(summary)
              .setDescription(description);
        // set custom field CI if exists
        String cfId = getCustomFieldIdByName("CI");
        if (cfId != null && ciValue!=null) {
            params.addCustomFieldValue(cfId, ciValue);
        }
        if (service != null) {
            String cfService = getCustomFieldIdByName("Service");
            if (cfService!=null) params.addCustomFieldValue(cfService, service);
        }

        IssueService.CreateValidationResult validation = issueService.validateCreate(user, params);
        if (!validation.isValid()) {
            log.error("Validation errors: " + validation.getErrorCollection());
            throw new RuntimeException("Validation failed: " + validation.getErrorCollection().toString());
        }
        IssueService.IssueResult res = issueService.create(user, validation);
        if (!res.isValid()) {
            throw new RuntimeException("Create failed");
        }
        // auto-assign L1
        autoAssignL1(res.getIssue());
        return res.getIssue().getId();
    }

    public Long createProblem(String summary, String description, String ciValue) {
        ApplicationUser user = getAutomationUser();
        IssueInputParameters params = issueService.newIssueInputParameters();
        params.setProjectKey("ITSM")
              .setIssueTypeId(getIssueTypeIdByName("Problem"))
              .setSummary(summary)
              .setDescription(description);
        String cfId = getCustomFieldIdByName("CI");
        if (cfId!=null && ciValue!=null) params.addCustomFieldValue(cfId, ciValue);

        IssueService.CreateValidationResult validation = issueService.validateCreate(user, params);
        IssueService.IssueResult res = issueService.create(user, validation);
        return res.getIssue().getId();
    }

    public Long createChangeFromProblem(Issue problem, String plannedStart, String plannedEnd) {
        ApplicationUser user = getAutomationUser();
        IssueInputParameters params = issueService.newIssueInputParameters();
        params.setProjectKey(problem.getProjectObject().getKey())
              .setIssueTypeId(getIssueTypeIdByName("Change"))
              .setSummary("Change for Problem " + problem.getKey())
              .setDescription("Auto-created from Problem " + problem.getKey());
        // copy CI custom field
        String cfId = getCustomFieldIdByName("CI");
        if (cfId!=null) {
            Object val = problem.getCustomFieldValue(
                ComponentAccessor.getCustomFieldManager().getCustomFieldObject(cfId)
            );
            if (val!=null) params.addCustomFieldValue(cfId, String.valueOf(val));
        }
        IssueService.CreateValidationResult validation = issueService.validateCreate(user, params);
        IssueService.IssueResult res = issueService.create(user, validation);
        return res.getIssue().getId();
    }

    private void autoAssignL1(Issue issue) {
        try {
            // simple rule: map service to L1 user/group (demo: hardcoded)
            String service = (String) issue.getCustomFieldValue(
                ComponentAccessor.getCustomFieldManager().getCustomFieldObject(getCustomFieldIdByName("Service"))
            );
            ApplicationUser assignee = findL1UserForService(service);
            if (assignee != null) {
                issue.setAssignee(assignee);
                ComponentAccessor.getIssueManager().updateIssue(assignee, issue,
                    com.atlassian.jira.event.type.EventDispatchOption.DO_NOT_DISPATCH, false);
            }
        } catch (Exception e) {
            log.warn("autoAssignL1 failed: " + e.getMessage());
        }
    }

    private ApplicationUser findL1UserForService(String service) {
        // demo: simple mapping
        if ("Network".equalsIgnoreCase(service)) return ComponentAccessor.getUserManager().getUserByName("netops");
        if ("DB".equalsIgnoreCase(service)) return ComponentAccessor.getUserManager().getUserByName("dba");
        return ComponentAccessor.getUserManager().getUserByName("oncall");
    }

    private Long getIssueTypeIdByName(String name) {
        return Long.valueOf(ComponentAccessor.getConstantsManager().getAllIssueTypeObjects().stream()
                .filter(t -> t.getName().equalsIgnoreCase(name))
                .findFirst().orElseThrow(() -> new RuntimeException("Issue type not found")).getId());
    }

    private String getCustomFieldIdByName(String name) {
        if (name==null) return null;
        com.atlassian.jira.issue.fields.CustomField cf = ComponentAccessor.getCustomFieldManager().getCustomFieldObjectByName(name);
        return cf == null ? null : cf.getId();
    }

    private ApplicationUser getAutomationUser() {
        return ComponentAccessor.getUserManager().getUserByName("automation"); // configure this user
    }
}
