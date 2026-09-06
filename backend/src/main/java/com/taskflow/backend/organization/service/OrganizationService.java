package com.taskflow.backend.organization.service;

import com.taskflow.backend.common.exception.BusinessException;
import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.organization.dto.AddMemberRequest;
import com.taskflow.backend.organization.dto.CreateOrganizationRequest;
import com.taskflow.backend.organization.dto.OrganizationResponse;
import com.taskflow.backend.organization.entity.Organization;
import com.taskflow.backend.organization.entity.OrganizationMember;
import com.taskflow.backend.organization.repository.OrganizationMemberRepository;
import com.taskflow.backend.organization.repository.OrganizationRepository;
import com.taskflow.backend.user.entity.User;
import com.taskflow.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrganizationResponse createOrganization(CreateOrganizationRequest request, UUID creatorId) {
        if (organizationRepository.findBySlug(request.getSlug()).isPresent()) {
            throw new BusinessException("Organization slug is already in use");
        }

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Organization org = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .build();
        
        organizationRepository.save(org);

        OrganizationMember owner = OrganizationMember.builder()
                .organization(org)
                .user(creator)
                .role("OWNER")
                .build();
        
        organizationMemberRepository.save(owner);

        return mapToResponse(org);
    }

    public OrganizationResponse getOrganization(UUID id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return mapToResponse(org);
    }

    @Transactional
    public void addMember(UUID organizationId, AddMemberRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (organizationMemberRepository.existsByOrganizationIdAndUserId(organizationId, user.getId())) {
            throw new BusinessException("User is already a member of this organization");
        }

        OrganizationMember member = OrganizationMember.builder()
                .organization(org)
                .user(user)
                .role(request.getRole())
                .build();

        organizationMemberRepository.save(member);
    }

    private OrganizationResponse mapToResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .description(org.getDescription())
                .logoUrl(org.getLogoUrl())
                .createdAt(org.getCreatedAt())
                .build();
    }
}
