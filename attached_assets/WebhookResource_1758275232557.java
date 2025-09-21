package com.example.itil.rest;

import javax.ws.rs.*;
import javax.ws.rs.core.*;
import org.json.JSONObject;
import com.example.itil.service.IssueCreatorService;
import com.example.itil.service.LinkingService;
import javax.inject.Inject;

@Path("/webhook")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class WebhookResource {

    private final IssueCreatorService issueCreator;
    private final LinkingService linkingService;

    @Inject
    public WebhookResource(IssueCreatorService issueCreator, LinkingService linkingService) {
        this.issueCreator = issueCreator;
        this.linkingService = linkingService;
    }

    @POST
    @Path("/alert")
    public Response receiveAlert(String body) {
        try {
            JSONObject json = new JSONObject(body);
            String summary = json.optString("summary", "Alert from monitor");
            String description = json.optString("description", "");
            String ci = json.optString("ciId", null);
            String service = json.optString("service", null);
            // Create incident
            Long incidentId = issueCreator.createIncident(summary, description, ci, service);
            // After create, link to existing problem or create problem
            if (ci != null) {
                linkingService.linkIncidentToProblem(incidentId, ci);
            }
            JSONObject resp = new JSONObject();
            resp.put("issueId", incidentId);
            return Response.ok(resp.toString()).build();
        } catch (Exception e) {
            return Response.serverError().entity("{\"error\":\"" + e.getMessage() + "\"}").build();
        }
    }
}
