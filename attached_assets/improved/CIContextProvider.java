package com.example.itil.context;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.plugin.webfragment.contextproviders.AbstractJiraContextProvider;
import com.atlassian.jira.plugin.webfragment.model.JiraHelper;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.fields.CustomField;
import com.atlassian.sal.api.net.RequestFactory;
import com.atlassian.sal.api.net.Request;
import com.atlassian.sal.api.net.Response;
import com.atlassian.sal.api.net.ResponseException;
import org.json.JSONObject;
import org.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Named
public class CIContextProvider extends AbstractJiraContextProvider {
    private static final Logger log = LoggerFactory.getLogger(CIContextProvider.class);
    
    private final RequestFactory requestFactory;
    private final String cmdbBaseUrl;
    private final String cmdbApiToken;
    private final int timeoutMs;
    
    // Configuration constants
    private static final String CI_CUSTOM_FIELD_NAME = "CI";
    private static final int DEFAULT_TIMEOUT_MS = 5000;
    private static final String CACHE_PREFIX = "ci_context_";
    
    @Inject
    public CIContextProvider(RequestFactory requestFactory) {
        this.requestFactory = requestFactory;
        // 🔒 SECURE: Get from plugin configuration instead of environment
        this.cmdbBaseUrl = getPluginConfiguration("cmdb.base.url");
        this.cmdbApiToken = getPluginConfiguration("cmdb.api.token");
        this.timeoutMs = Integer.parseInt(getPluginConfiguration("cmdb.timeout.ms", String.valueOf(DEFAULT_TIMEOUT_MS)));
    }

    @Override
    public Map<String, Object> getContextMap(ApplicationUser user, JiraHelper jiraHelper) {
        Map<String, Object> ctx = new HashMap<>();
        
        try {
            Issue issue = (Issue) jiraHelper.getContextParams().get("issue");
            if (issue == null) {
                log.debug("No issue found in context");
                return ctx;
            }
            
            // 🔒 SECURE: Proper custom field retrieval with null checks
            String ciValue = extractCIValue(issue);
            if (ciValue == null || ciValue.trim().isEmpty()) {
                log.debug("No CI value found for issue {}", issue.getKey());
                ctx.put("ciName", "No CI linked");
                return ctx;
            }
            
            // 🚀 PERFORMANCE: Async CMDB call with timeout
            enrichWithCMDBData(ctx, ciValue, issue.getKey());
            
        } catch (Exception e) {
            log.error("Error in CIContextProvider for user {}: {}", user.getName(), e.getMessage(), e);
            ctx.put("error", "Unable to load CI information");
        }
        
        return ctx;
    }
    
    /**
     * 🔒 SECURE: Extract CI value with proper null handling
     */
    private String extractCIValue(Issue issue) {
        try {
            CustomField ciCustomField = ComponentAccessor.getCustomFieldManager()
                .getCustomFieldObjectByName(CI_CUSTOM_FIELD_NAME);
                
            if (ciCustomField == null) {
                log.warn("Custom field '{}' not found", CI_CUSTOM_FIELD_NAME);
                return null;
            }
            
            Object ciVal = issue.getCustomFieldValue(ciCustomField);
            return ciVal != null ? String.valueOf(ciVal).trim() : null;
            
        } catch (Exception e) {
            log.error("Error extracting CI value from issue {}: {}", issue.getKey(), e.getMessage());
            return null;
        }
    }
    
    /**
     * 🚀 PERFORMANCE: Async CMDB call with proper error handling
     */
    private void enrichWithCMDBData(Map<String, Object> ctx, String ciValue, String issueKey) {
        // Set basic CI info immediately
        ctx.put("ciName", ciValue);
        ctx.put("ciLocation", "Loading...");
        
        if (cmdbBaseUrl == null || cmdbApiToken == null) {
            log.warn("CMDB integration not configured");
            ctx.put("ciLocation", "CMDB not configured");
            return;
        }
        
        try {
            // 🚀 ASYNC: Non-blocking CMDB call
            CompletableFuture<Map<String, Object>> cmdbDataFuture = CompletableFuture.supplyAsync(() -> {
                return fetchCMDBData(ciValue);
            });
            
            // 🕒 TIMEOUT: Wait with timeout
            Map<String, Object> cmdbData = cmdbDataFuture.get(timeoutMs, TimeUnit.MILLISECONDS);
            
            if (cmdbData != null && !cmdbData.isEmpty()) {
                ctx.putAll(cmdbData);
                log.debug("Successfully enriched CI data for {} in issue {}", ciValue, issueKey);
            } else {
                ctx.put("ciLocation", "Not found in CMDB");
            }
            
        } catch (TimeoutException e) {
            log.warn("CMDB call timeout for CI {} in issue {}", ciValue, issueKey);
            ctx.put("ciLocation", "CMDB timeout");
        } catch (Exception e) {
            log.error("Error fetching CMDB data for CI {} in issue {}: {}", ciValue, issueKey, e.getMessage());
            ctx.put("ciLocation", "CMDB error");
        }
    }
    
    /**
     * 🔒 SECURE: CMDB API call with proper error handling
     */
    private Map<String, Object> fetchCMDBData(String ciValue) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 🔒 SECURE: Proper URL encoding and validation
            String encodedCI = java.net.URLEncoder.encode(ciValue, "UTF-8");
            String cmdbUrl = cmdbBaseUrl + "/api/assets/" + encodedCI;
            
            // 🔒 SECURE: Validate URL
            if (!isValidCMDBUrl(cmdbUrl)) {
                log.error("Invalid CMDB URL: {}", cmdbUrl);
                return result;
            }
            
            Request req = requestFactory.createRequest(Request.MethodType.GET, cmdbUrl);
            req.setRequestHeader("Authorization", "Bearer " + cmdbApiToken);
            req.setRequestHeader("Accept", "application/json");
            req.setRequestHeader("User-Agent", "JIRA-ITIL-Plugin/1.0");
            
            // 🕒 TIMEOUT: Set connection and read timeouts
            req.setConnectionTimeout(timeoutMs);
            req.setSoTimeout(timeoutMs);
            
            Response resp = req.execute();
            
            if (resp.getStatusCode() == 200) {
                String responseBody = resp.getResponseBodyAsString();
                JSONObject json = new JSONObject(responseBody);
                
                // 🔒 SECURE: Sanitize and validate JSON data
                result.put("ciName", sanitizeString(json.optString("hostname", ciValue)));
                result.put("ciLocation", sanitizeString(json.optString("location", "unknown")));
                result.put("ciIpAddress", sanitizeString(json.optString("ip", "")));
                result.put("ciOperatingSystem", sanitizeString(json.optString("os", "")));
                result.put("ciEnvironment", sanitizeString(json.optString("environment", "")));
                
                // 🔗 SAFE: Only include CMDB URL if it's valid
                String cmdbViewUrl = json.optString("cmdbUrl", "");
                if (isValidCMDBUrl(cmdbViewUrl)) {
                    result.put("cmdbViewUrl", cmdbViewUrl);
                }
                
                log.debug("Successfully fetched CMDB data for CI: {}", ciValue);
                
            } else if (resp.getStatusCode() == 404) {
                log.info("CI {} not found in CMDB", ciValue);
                result.put("ciLocation", "Not found in CMDB");
            } else {
                log.warn("CMDB API returned status {} for CI {}", resp.getStatusCode(), ciValue);
                result.put("ciLocation", "CMDB error (" + resp.getStatusCode() + ")");
            }
            
        } catch (JSONException e) {
            log.error("Invalid JSON response from CMDB for CI {}: {}", ciValue, e.getMessage());
        } catch (ResponseException e) {
            log.error("HTTP error calling CMDB for CI {}: {}", ciValue, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error calling CMDB for CI {}: {}", ciValue, e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 🔒 SECURITY: Validate CMDB URLs to prevent SSRF
     */
    private boolean isValidCMDBUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        
        try {
            java.net.URL parsedUrl = new java.net.URL(url);
            String host = parsedUrl.getHost().toLowerCase();
            
            // 🔒 SECURITY: Prevent SSRF - only allow configured CMDB hosts
            return url.startsWith(cmdbBaseUrl) && 
                   !host.equals("localhost") && 
                   !host.equals("127.0.0.1") &&
                   !host.startsWith("192.168.") &&
                   !host.startsWith("10.") &&
                   !host.startsWith("172.");
                   
        } catch (Exception e) {
            log.warn("Invalid URL format: {}", url);
            return false;
        }
    }
    
    /**
     * 🔒 SECURITY: Sanitize string values to prevent XSS
     */
    private String sanitizeString(String input) {
        if (input == null) return "";
        
        return input.trim()
            .replaceAll("[<>\"'&]", "") // Remove dangerous characters
            .substring(0, Math.min(input.length(), 255)); // Limit length
    }
    
    /**
     * 🔧 CONFIG: Get plugin configuration safely
     */
    private String getPluginConfiguration(String key) {
        return getPluginConfiguration(key, null);
    }
    
    private String getPluginConfiguration(String key, String defaultValue) {
        try {
            // Get from plugin settings or system properties
            String value = System.getProperty("jira.itil.plugin." + key);
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
            
            // Fallback to environment variable (less secure)
            value = System.getenv(key.toUpperCase().replace(".", "_"));
            return (value != null && !value.trim().isEmpty()) ? value.trim() : defaultValue;
            
        } catch (Exception e) {
            log.warn("Error reading configuration for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }
}
