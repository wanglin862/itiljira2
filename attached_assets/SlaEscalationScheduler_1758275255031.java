package com.example.itil.sla;

import com.atlassian.scheduler.SchedulerService;
import com.atlassian.scheduler.JobRunnerRequest;
import com.atlassian.scheduler.JobRunnerResponse;
import com.atlassian.scheduler.JobRunner;
import com.atlassian.scheduler.config.JobConfig;
import com.atlassian.scheduler.config.JobId;
import com.atlassian.scheduler.config.RunMode;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.Issue;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import java.util.List;

@Named
public class SlaEscalationScheduler {
    private final SchedulerService schedulerService;

    @Inject
    public SlaEscalationScheduler(SchedulerService schedulerService) {
        this.schedulerService = schedulerService;
    }

    @PostConstruct
    public void init() {
        JobId id = JobId.of("itil-sla-escalation-job");
        Runnable job = () -> {
            // find incidents older than threshold (e.g., created <= -2h)
            // simple JQL via SearchService (omitted here for brevity)
            // escalate by reassigning to L2 or add comment
        };
        JobConfig config = JobConfig.forJobRunnerKey("itil-sla-escalation-key").withRunMode(RunMode.RUN_LOCALLY);
        schedulerService.scheduleJob(id, job::run, config);
    }
}
