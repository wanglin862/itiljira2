package com.example.itil.context;

import com.atlassian.jira.plugin.webfragment.contextproviders.AbstractJiraContextProvider;
import com.atlassian.jira.plugin.webfragment.model.JiraHelper;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.issue.Issue;
import com.atlassian.sal.api.net.RequestFactory;
import com.atlassian.sal.api.net.Request;
import com.atlassian.sal.api.net.Response;
import org.json.JSONObject;

import javax.inject.Inject;
import java.util.HashMap;
import java.util.Map;

public class CIContextProvider extends AbstractJiraContextProvider {
    private final RequestFactory requestFactory;

    @Inject
    public CIContextProvider(RequestFactory requestFactory) {
        this.requestFactory = requestFactory;
    }

    @Override
    public Map<String,Object> getContextMap(ApplicationUser user, JiraHelper jiraHelper) {
        Map<String,Object> ctx = new HashMap<>();
        Issue issue = (Issue) jiraHelper.getContextParams().get("issue");
        if (issue == null) return ctx;
        String cfId = "CI"; // custom field display name
        Object ciVal = issue.getCustomFieldValue(ComponentAccessor.getCustomFieldManager().getCustomFieldObjectByName(cfId));
        if (ciVal != null) {
            String ci = String.valueOf(ciVal);
            // call CMDB API (example)
            try {
                String cmdbUrl = System.getenv("CMDB_URL") + "/api/assets/" + ci;
                Request req = requestFactory.createRequest(Request.MethodType.GET, cmdbUrl);
                req.setRequestHeader("Authorization", "Bearer " + System.getenv("CMDB_TOKEN"));
                Response resp = req.execute();
                if (resp.getStatusCode() == 200) {
                    JSONObject json = new JSONObject(resp.getResponseBodyAsString());
                    ctx.put("ciJson", json.toMap());
                    ctx.put("ciName", json.optString("hostname", ci));
                    ctx.put("ciLocation", json.optString("location", "unknown"));
                }
            } catch (Exception e) {
                ctx.put("ciName", ci);
                ctx.put("ciLocation", "unknown");
            }
        }
        return ctx;
    }
}
