package com.example.itil.rest;

import javax.ws.rs.*;
import javax.ws.rs.core.*;
import javax.servlet.http.HttpServletRequest;
import javax.annotation.security.RolesAllowed;
import javax.inject.Inject;
import javax.inject.Named;

import org.json.JSONObject;
import org.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.atlassian.jira.security.JiraAuthenticationContext;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.sal.api.user.UserProfile;

import com.example.itil.service.IssueCreatorService;
import com.example.itil.service.LinkingService;
import com.example.itil.security.WebhookAuthenticationService;
import com.example.itil.validation.WebhookValidator;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Path("/webhook")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Named
public class WebhookResource {
    
    private static final Logger log = LoggerFactory.getLogger(WebhookResource.class);
    
    private final IssueCreatorService issueCreator;
    private final LinkingService linkingService;
    private final WebhookAuthenticationService authService;
    private final WebhookValidator validator;
    private final UserManager userManager;
    private final JiraAuthenticationContext jiraAuthContext;
    
    // Security constants
    private static final int MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
    private static final Pattern SAFE_STRING_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s\\-_.,!?()\\[\\]{}:;\"'@#$%^&*+=|\\\\/<>~`]*$");
    private static final int MAX_STRING_LENGTH = 1000;
    
    @Inject
    public WebhookResource(
            IssueCreatorService issueCreator,
            LinkingService linkingService,
            WebhookAuthenticationService authService,
            WebhookValidator validator,
            UserManager userManager,
            JiraAuthenticationContext jiraAuthContext) {
        this.issueCreator = issueCreator;
        this.linkingService = linkingService;
        this.authService = authService;
        this.validator = validator;
        this.userManager = userManager;
        this.jiraAuthContext = jiraAuthContext;
    }

    /**
     * 🔒 SECURE: Webhook endpoint with authentication and validation
     */
    @POST
    @Path("/alert")
    public Response receiveAlert(
            String body,
            @Context HttpServletRequest request,
            @HeaderParam("Authorization") String authHeader,
            @HeaderParam("X-Webhook-Source") String source,
            @HeaderParam("X-Webhook-Signature") String signature) {
        
        long startTime = System.currentTimeMillis();
        String clientIp = getClientIpAddress(request);
        
        try {
            // 🔒 SECURITY: Input validation
            ValidationResult validation = validateRequest(body, authHeader, source, signature, clientIp);
            if (!validation.isValid) {
                log.warn("Invalid webhook request from {}: {}", clientIp, validation.error);
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(createErrorResponse("Invalid request: " + validation.error))
                    .build();
            }
            
            // 🔒 AUTHENTICATION: Verify webhook authentication
            if (!authService.authenticateWebhook(authHeader, signature, body, source)) {
                log.warn("Unauthorized webhook request from {} with source {}", clientIp, source);
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(createErrorResponse("Unauthorized"))
                    .build();
            }
            
            // 📊 PARSE: Parse and validate JSON payload
            AlertPayload alertData = parseAlertPayload(body);
            if (alertData == null) {
                log.error("Failed to parse alert payload from {}", clientIp);
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(createErrorResponse("Invalid JSON payload"))
                    .build();
            }
            
            // 🎯 PROCESS: Create incident with proper error handling
            IncidentCreationResult result = processAlert(alertData, clientIp, source);
            
            // 📝 AUDIT: Log successful processing
            long processingTime = System.currentTimeMillis() - startTime;
            log.info("Successfully processed alert from {} in {}ms, created incident: {}", 
                    clientIp, processingTime, result.incidentKey);
            
            // 📤 RESPONSE: Return success response
            JSONObject response = new JSONObject();
            response.put("success", true);
            response.put("incidentId", result.incidentId);
            response.put("incidentKey", result.incidentKey);
            response.put("processingTimeMs", processingTime);
            
            if (result.linkedProblemId != null) {
                response.put("linkedProblemId", result.linkedProblemId);
            }
            
            return Response.ok(response.toString()).build();
            
        } catch (SecurityException e) {
            log.warn("Security violation in webhook from {}: {}", clientIp, e.getMessage());
            return Response.status(Response.Status.FORBIDDEN)
                .entity(createErrorResponse("Access denied"))
                .build();
                
        } catch (IllegalArgumentException e) {
            log.warn("Invalid argument in webhook from {}: {}", clientIp, e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(createErrorResponse("Invalid input: " + e.getMessage()))
                .build();
                
        } catch (Exception e) {
            log.error("Unexpected error processing webhook from {}: {}", clientIp, e.getMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("Internal server error"))
                .build();
        }
    }
    
    /**
     * 🔒 VALIDATION: Comprehensive request validation
     */
    private ValidationResult validateRequest(String body, String authHeader, String source, 
                                           String signature, String clientIp) {
        
        // Check payload size
        if (body == null || body.isEmpty()) {
            return new ValidationResult(false, "Empty payload");
        }
        
        if (body.length() > MAX_PAYLOAD_SIZE) {
            return new ValidationResult(false, "Payload too large");
        }
        
        // Check required headers
        if (authHeader == null || authHeader.trim().isEmpty()) {
            return new ValidationResult(false, "Missing Authorization header");
        }
        
        if (source == null || source.trim().isEmpty()) {
            return new ValidationResult(false, "Missing X-Webhook-Source header");
        }
        
        // Validate source
        if (!validator.isValidWebhookSource(source)) {
            return new ValidationResult(false, "Invalid webhook source");
        }
        
        // Check IP whitelist
        if (!validator.isIpWhitelisted(clientIp)) {
            return new ValidationResult(false, "IP not whitelisted");
        }
        
        return new ValidationResult(true, null);
    }
    
    /**
     * 📊 PARSING: Safe JSON parsing with validation
     */
    private AlertPayload parseAlertPayload(String body) {
        try {
            JSONObject json = new JSONObject(body);
            
            // 🔒 SANITIZE: Extract and sanitize required fields
            String summary = sanitizeString(json.optString("summary", "Alert from monitoring"));
            String description = sanitizeString(json.optString("description", ""));
            String ciId = sanitizeString(json.optString("ciId", null));
            String service = sanitizeString(json.optString("service", null));
            String severity = sanitizeString(json.optString("severity", "Medium"));
            String alertType = sanitizeString(json.optString("alertType", "Incident"));
            
            // Validate required fields
            if (summary.isEmpty()) {
                log.warn("Alert payload missing required 'summary' field");
                return null;
            }
            
            // Create validated payload object
            AlertPayload payload = new AlertPayload();
            payload.summary = summary;
            payload.description = description;
            payload.ciId = ciId;
            payload.service = service;
            payload.severity = severity;
            payload.alertType = alertType;
            
            // Optional fields
            payload.environment = sanitizeString(json.optString("environment", ""));
            payload.component = sanitizeString(json.optString("component", ""));
            payload.tags = json.optJSONArray("tags");
            
            return payload;
            
        } catch (JSONException e) {
            log.error("Invalid JSON in alert payload: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Error parsing alert payload: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * 🎯 PROCESSING: Process alert and create incident
     */
    private IncidentCreationResult processAlert(AlertPayload alertData, String clientIp, String source) {
        try {
            // 🎫 CREATE: Create incident with proper error handling
            Long incidentId = issueCreator.createIncident(
                alertData.summary,
                alertData.description,
                alertData.ciId,
                alertData.service,
                alertData.severity,
                alertData.environment,
                source
            );
            
            if (incidentId == null) {
                throw new RuntimeException("Failed to create incident - null ID returned");
            }
            
            // 🔗 LINK: Link to existing problem if CI is provided
            Long linkedProblemId = null;
            if (alertData.ciId != null && !alertData.ciId.isEmpty()) {
                try {
                    linkedProblemId = linkingService.linkIncidentToProblem(incidentId, alertData.ciId);
                    if (linkedProblemId != null) {
                        log.debug("Linked incident {} to problem {} for CI {}", 
                                incidentId, linkedProblemId, alertData.ciId);
                    }
                } catch (Exception e) {
                    log.warn("Failed to link incident {} to problem for CI {}: {}", 
                            incidentId, alertData.ciId, e.getMessage());
                    // Don't fail the whole operation if linking fails
                }
            }
            
            // Get incident key for response
            String incidentKey = issueCreator.getIssueKey(incidentId);
            
            return new IncidentCreationResult(incidentId, incidentKey, linkedProblemId);
            
        } catch (Exception e) {
            log.error("Error processing alert from {}: {}", clientIp, e.getMessage(), e);
            throw new RuntimeException("Failed to process alert: " + e.getMessage(), e);
        }
    }
    
    /**
     * 🔒 SECURITY: Sanitize string input
     */
    private String sanitizeString(String input) {
        if (input == null) {
            return null;
        }
        
        String trimmed = input.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        
        // Limit length
        if (trimmed.length() > MAX_STRING_LENGTH) {
            trimmed = trimmed.substring(0, MAX_STRING_LENGTH);
        }
        
        // Check for safe characters
        if (!SAFE_STRING_PATTERN.matcher(trimmed).matches()) {
            log.warn("Input contains potentially dangerous characters: {}", trimmed);
            // Remove dangerous characters
            trimmed = trimmed.replaceAll("[<>&\"'`]", "");
        }
        
        return trimmed.isEmpty() ? null : trimmed;
    }
    
    /**
     * 🌐 UTILITY: Get real client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * 📝 UTILITY: Create standardized error response
     */
    private String createErrorResponse(String message) {
        JSONObject error = new JSONObject();
        error.put("success", false);
        error.put("error", message);
        error.put("timestamp", System.currentTimeMillis());
        return error.toString();
    }
    
    // Data classes
    private static class ValidationResult {
        final boolean isValid;
        final String error;
        
        ValidationResult(boolean isValid, String error) {
            this.isValid = isValid;
            this.error = error;
        }
    }
    
    private static class AlertPayload {
        String summary;
        String description;
        String ciId;
        String service;
        String severity;
        String alertType;
        String environment;
        String component;
        org.json.JSONArray tags;
    }
    
    private static class IncidentCreationResult {
        final Long incidentId;
        final String incidentKey;
        final Long linkedProblemId;
        
        IncidentCreationResult(Long incidentId, String incidentKey, Long linkedProblemId) {
            this.incidentId = incidentId;
            this.incidentKey = incidentKey;
            this.linkedProblemId = linkedProblemId;
        }
    }
}
