package com.taskflow.backend.organization.controller;

import com.taskflow.backend.auth.security.UserDetailsImpl;
import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.organization.dto.AddMemberRequest;
import com.taskflow.backend.organization.dto.CreateOrganizationRequest;
import com.taskflow.backend.organization.dto.OrganizationResponse;
import com.taskflow.backend.organization.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrganizationResponse>> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        OrganizationResponse response = organizationService.createOrganization(request, userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Organization created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> getOrganization(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Organization retrieved", organizationService.getOrganization(id)));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddMemberRequest request) {
        
        organizationService.addMember(id, request);
        return ResponseEntity.ok(ApiResponse.success("Member added successfully", null));
    }
}
