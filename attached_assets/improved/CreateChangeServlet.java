package com.example.itil.servlet;

import javax.servlet.*;
import javax.servlet.http.*;
import java.io.IOException;
import java.util.regex.Pattern;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.link.IssueLink;
import com.atlassian.jira.issue.link.IssueLinkType;
import com.atlassian.jira.security.JiraAuthenticationContext;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.security.Permissions;

import com.example.itil.service.IssueCreatorService;
import com.example.itil.service.ValidationService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CreateChangeServlet extends HttpServlet {
    
    private static final Logger log = LoggerFactory.getLogger(CreateChangeServlet.class);
    
    // Security constants
    private static final Pattern PROBLEM_ID_PATTERN = Pattern.compile("^\\d{1,10}$");
    private static final String RELATES_LINK_TYPE = "Relates";
    private static final String IMPLEMENTS_LINK_TYPE = "Implements";
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        
        String clientIp = getClientIpAddress(req);
        long startTime = System.currentTimeMillis();
        
        try {
            // 🔒 SECURITY: Validate user authentication and authorization
            ApplicationUser currentUser = getCurrentUser();
            if (currentUser == null) {
                log.warn("Unauthorized access attempt to CreateChangeServlet from {}", clientIp);
                resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
                return;
            }
            
            // 🔒 VALIDATION: Validate and sanitize input parameters
            String problemId = req.getParameter("problemId");
            ValidationResult validation = validateParameters(problemId, currentUser, clientIp);
            if (!validation.isValid) {
                log.warn("Invalid request to CreateChangeServlet from {} by {}: {}", 
                        clientIp, currentUser.getName(), validation.error);
                resp.sendError(HttpServletResponse.SC_BAD_REQUEST, validation.error);
                return;
            }
            
            // 🎫 RETRIEVE: Get problem issue with proper error handling
            Issue problemIssue = getIssueById(Long.valueOf(problemId));
            if (problemIssue == null) {
                log.warn("Problem issue {} not found for user {} from {}", 
                        problemId, currentUser.getName(), clientIp);
                resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Problem issue not found");
                return;
            }
            
            // 🔒 AUTHORIZATION: Check if user can view the problem issue
            if (!canUserViewIssue(currentUser, problemIssue)) {
                log.warn("User {} cannot view problem issue {} from {}", 
                        currentUser.getName(), problemId, clientIp);
                resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied to problem issue");
                return;
            }
            
            // 🔒 AUTHORIZATION: Check if user can create change requests
            if (!canUserCreateChangeRequests(currentUser, problemIssue.getProjectObject().getKey())) {
                log.warn("User {} cannot create change requests in project {} from {}", 
                        currentUser.getName(), problemIssue.getProjectObject().getKey(), clientIp);
                resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied to create change requests");
                return;
            }
            
            // 🎯 PROCESS: Create change request from problem
            ChangeCreationResult result = createChangeFromProblem(problemIssue, currentUser);
            if (result == null || result.changeId == null) {
                log.error("Failed to create change request from problem {} by user {}", 
                        problemId, currentUser.getName());
                resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to create change request");
                return;
            }
            
            // 🔗 LINK: Link change request to problem
            boolean linkCreated = linkChangeRequestToProblem(result.changeId, problemIssue, currentUser);
            if (!linkCreated) {
                log.warn("Created change request {} but failed to link to problem {} by user {}", 
                        result.changeKey, problemId, currentUser.getName());
                // Don't fail the operation, just log the warning
            }
            
            // 📝 AUDIT: Log successful operation
            long processingTime = System.currentTimeMillis() - startTime;
            log.info("Successfully created change request {} from problem {} by user {} in {}ms", 
                    result.changeKey, problemId, currentUser.getName(), processingTime);
            
            // 📤 REDIRECT: Redirect to the created change request
            String redirectUrl = req.getContextPath() + "/browse/" + result.changeKey;
            resp.sendRedirect(redirectUrl);
            
        } catch (NumberFormatException e) {
            log.warn("Invalid problem ID format '{}' from {} by user {}", 
                    req.getParameter("problemId"), clientIp, getCurrentUserName());
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid problem ID format");
            
        } catch (SecurityException e) {
            log.warn("Security violation in CreateChangeServlet from {}: {}", clientIp, e.getMessage());
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
            
        } catch (Exception e) {
            log.error("Unexpected error in CreateChangeServlet from {} by user {}: {}", 
                    clientIp, getCurrentUserName(), e.getMessage(), e);
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        // POST not supported for this endpoint
        resp.sendError(HttpServletResponse.SC_METHOD_NOT_ALLOWED, "POST method not supported");
    }
    
    /**
     * 🔒 VALIDATION: Comprehensive parameter validation
     */
    private ValidationResult validateParameters(String problemId, ApplicationUser user, String clientIp) {
        
        // Check problem ID
        if (problemId == null || problemId.trim().isEmpty()) {
            return new ValidationResult(false, "Missing problemId parameter");
        }
        
        problemId = problemId.trim();
        
        // Validate problem ID format (security: prevent injection)
        if (!PROBLEM_ID_PATTERN.matcher(problemId).matches()) {
            return new ValidationResult(false, "Invalid problemId format");
        }
        
        // Check user
        if (user == null) {
            return new ValidationResult(false, "User authentication required");
        }
        
        return new ValidationResult(true, null);
    }
    
    /**
     * 🎫 RETRIEVE: Safely get issue by ID
     */
    private Issue getIssueById(Long issueId) {
        try {
            return ComponentAccessor.getIssueManager().getIssueObject(issueId);
        } catch (Exception e) {
            log.error("Error retrieving issue with ID {}: {}", issueId, e.getMessage());
            return null;
        }
    }
    
    /**
     * 🔒 AUTHORIZATION: Check if user can view issue
     */
    private boolean canUserViewIssue(ApplicationUser user, Issue issue) {
        try {
            PermissionManager permissionManager = ComponentAccessor.getPermissionManager();
            return permissionManager.hasPermission(Permissions.BROWSE, issue, user);
        } catch (Exception e) {
            log.error("Error checking view permission for user {} on issue {}: {}", 
                    user.getName(), issue.getKey(), e.getMessage());
            return false;
        }
    }
    
    /**
     * 🔒 AUTHORIZATION: Check if user can create change requests
     */
    private boolean canUserCreateChangeRequests(ApplicationUser user, String projectKey) {
        try {
            PermissionManager permissionManager = ComponentAccessor.getPermissionManager();
            return permissionManager.hasPermission(Permissions.CREATE_ISSUE, 
                    ComponentAccessor.getProjectManager().getProjectByCurrentKey(projectKey), user);
        } catch (Exception e) {
            log.error("Error checking create permission for user {} in project {}: {}", 
                    user.getName(), projectKey, e.getMessage());
            return false;
        }
    }
    
    /**
     * 🎯 PROCESS: Create change request from problem
     */
    private ChangeCreationResult createChangeFromProblem(Issue problemIssue, ApplicationUser user) {
        try {
            IssueCreatorService creator = ComponentAccessor.getComponent(IssueCreatorService.class);
            if (creator == null) {
                log.error("IssueCreatorService not available");
                return null;
            }
            
            // Create change request with enhanced data from problem
            String changeTitle = "Change Request for Problem: " + problemIssue.getSummary();
            String changeDescription = buildChangeDescription(problemIssue);
            
            Long changeId = creator.createChangeFromProblem(
                problemIssue, 
                changeTitle, 
                changeDescription,
                user
            );
            
            if (changeId == null) {
                log.error("IssueCreatorService returned null change ID");
                return null;
            }
            
            // Get the created change issue to get its key
            Issue changeIssue = getIssueById(changeId);
            if (changeIssue == null) {
                log.error("Created change issue {} not found", changeId);
                return null;
            }
            
            return new ChangeCreationResult(changeId, changeIssue.getKey());
            
        } catch (Exception e) {
            log.error("Error creating change request from problem {}: {}", 
                    problemIssue.getKey(), e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 🔗 LINK: Link change request to problem with proper error handling
     */
    private boolean linkChangeRequestToProblem(Long changeId, Issue problemIssue, ApplicationUser user) {
        try {
            // Try to find "Implements" link type first (more specific)
            IssueLinkType linkType = findIssueLinkType(IMPLEMENTS_LINK_TYPE);
            
            // Fallback to "Relates" link type
            if (linkType == null) {
                linkType = findIssueLinkType(RELATES_LINK_TYPE);
            }
            
            if (linkType == null) {
                log.warn("No suitable issue link type found (tried {} and {})", 
                        IMPLEMENTS_LINK_TYPE, RELATES_LINK_TYPE);
                return false;
            }
            
            // Create the link: Change -> Problem
            ComponentAccessor.getIssueLinkManager().createIssueLink(
                changeId,                    // source (change)
                problemIssue.getId(),        // destination (problem)  
                linkType.getId(),            // link type
                1L,                          // sequence (outward link)
                user                         // user creating the link
            );
            
            log.debug("Successfully linked change {} to problem {} with link type {}", 
                    changeId, problemIssue.getKey(), linkType.getName());
            
            return true;
            
        } catch (Exception e) {
            log.error("Error linking change {} to problem {}: {}", 
                    changeId, problemIssue.getKey(), e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 🔗 UTILITY: Find issue link type by name
     */
    private IssueLinkType findIssueLinkType(String linkTypeName) {
        try {
            return ComponentAccessor.getIssueLinkTypeManager()
                .getIssueLinkTypesByName(linkTypeName)
                .stream()
                .findFirst()
                .orElse(null);
        } catch (Exception e) {
            log.error("Error finding issue link type '{}': {}", linkTypeName, e.getMessage());
            return null;
        }
    }
    
    /**
     * 📝 UTILITY: Build change request description from problem
     */
    private String buildChangeDescription(Issue problemIssue) {
        StringBuilder description = new StringBuilder();
        description.append("This change request was created to address Problem: ")
                   .append(problemIssue.getKey())
                   .append("\n\n");
        
        description.append("Problem Summary: ")
                   .append(problemIssue.getSummary())
                   .append("\n\n");
        
        if (problemIssue.getDescription() != null && !problemIssue.getDescription().trim().isEmpty()) {
            description.append("Problem Description:\n")
                       .append(problemIssue.getDescription())
                       .append("\n\n");
        }
        
        description.append("Please review the linked problem for full details and implement the necessary changes.");
        
        return description.toString();
    }
    
    /**
     * 🔒 SECURITY: Get current authenticated user
     */
    private ApplicationUser getCurrentUser() {
        try {
            JiraAuthenticationContext authContext = ComponentAccessor.getJiraAuthenticationContext();
            return authContext.getLoggedInUser();
        } catch (Exception e) {
            log.error("Error getting current user: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * 🔒 SECURITY: Get current user name safely
     */
    private String getCurrentUserName() {
        ApplicationUser user = getCurrentUser();
        return user != null ? user.getName() : "anonymous";
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
    
    // Data classes
    private static class ValidationResult {
        final boolean isValid;
        final String error;
        
        ValidationResult(boolean isValid, String error) {
            this.isValid = isValid;
            this.error = error;
        }
    }
    
    private static class ChangeCreationResult {
        final Long changeId;
        final String changeKey;
        
        ChangeCreationResult(Long changeId, String changeKey) {
            this.changeId = changeId;
            this.changeKey = changeKey;
        }
    }
}
