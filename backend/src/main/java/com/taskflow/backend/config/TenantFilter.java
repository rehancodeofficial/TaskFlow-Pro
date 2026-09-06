package com.taskflow.backend.config;

import com.taskflow.backend.auth.security.UserDetailsImpl;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.organization.repository.OrganizationMemberRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {

    private final OrganizationMemberRepository organizationMemberRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        String tenantIdHeader = request.getHeader("X-Tenant-ID");
        
        if (tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
            try {
                UUID tenantId = UUID.fromString(tenantIdHeader);
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                
                if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
                    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                    
                    boolean isMember = organizationMemberRepository.existsByOrganizationIdAndUserId(tenantId, userDetails.getUser().getId());
                    if (!isMember) {
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied: You do not belong to this organization.");
                        return;
                    }
                    
                    TenantContext.setTenantId(tenantId);
                }
            } catch (IllegalArgumentException e) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid X-Tenant-ID header format.");
                return;
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
