package com.taskflow.backend.team.service;

import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.organization.entity.Organization;
import com.taskflow.backend.organization.repository.OrganizationRepository;
import com.taskflow.backend.team.dto.CreateTeamRequest;
import com.taskflow.backend.team.entity.Team;
import com.taskflow.backend.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public Team createTeam(CreateTeamRequest request) {
        Organization org = organizationRepository.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Team team = Team.builder()
                .organization(org)
                .name(request.getName())
                .description(request.getDescription())
                .build();
        
        return teamRepository.save(team);
    }

    public List<Team> getTeamsForCurrentTenant() {
        return teamRepository.findByOrganizationId(TenantContext.getTenantId());
    }
}
