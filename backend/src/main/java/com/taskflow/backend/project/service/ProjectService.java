package com.taskflow.backend.project.service;

import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.organization.entity.Organization;
import com.taskflow.backend.organization.repository.OrganizationRepository;
import com.taskflow.backend.project.dto.CreateProjectRequest;
import com.taskflow.backend.project.entity.Project;
import com.taskflow.backend.project.repository.ProjectRepository;
import com.taskflow.backend.team.entity.Team;
import com.taskflow.backend.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final TeamRepository teamRepository;

    @Transactional
    public Project createProject(CreateProjectRequest request) {
        Organization org = organizationRepository.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        }

        Project project = Project.builder()
                .organization(org)
                .team(team)
                .name(request.getName())
                .key(request.getKey())
                .description(request.getDescription())
                .status("ACTIVE")
                .build();
        
        return projectRepository.save(project);
    }

    public List<Project> getProjectsForCurrentTenant() {
        return projectRepository.findByOrganizationId(TenantContext.getTenantId());
    }
}
