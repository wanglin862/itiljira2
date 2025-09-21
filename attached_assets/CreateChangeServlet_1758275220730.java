package com.example.itil.servlet;

import javax.servlet.*;
import javax.servlet.http.*;
import java.io.IOException;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.Issue;
import com.example.itil.service.IssueCreatorService;

public class CreateChangeServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String problemId = req.getParameter("problemId");
        if (problemId == null) {
            resp.sendError(400, "missing problemId");
            return;
        }
        Issue problem = ComponentAccessor.getIssueManager().getIssueObject(Long.valueOf(problemId));
        IssueCreatorService creator = ComponentAccessor.getComponent(IssueCreatorService.class);
        Long changeId = creator.createChangeFromProblem(problem, null, null);
        // link change -> problem
        ComponentAccessor.getIssueLinkManager().createIssueLink(changeId, problem.getId(),
              ComponentAccessor.getIssueLinkTypeManager().getIssueLinkTypesByName("Relates").iterator().next().getId(),
              1L, ComponentAccessor.getJiraAuthenticationContext().getLoggedInUser());
        resp.sendRedirect("/browse/" + problem.getKey());
    }
}
