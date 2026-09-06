package com.taskflow.backend.analytics.service;

import com.taskflow.backend.analytics.dto.DashboardMetrics;
import com.taskflow.backend.organization.repository.OrganizationMemberRepository;
import com.taskflow.backend.project.repository.ProjectRepository;
import com.taskflow.backend.sprint.repository.SprintRepository;
import com.taskflow.backend.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final OrganizationMemberRepository organizationMemberRepository;

    @Cacheable(value = "analytics", key = "'dashboard:' + #organizationId")
    public DashboardMetrics getDashboardMetrics(UUID organizationId) {
        log.info("Computing dashboard metrics for org: {}", organizationId);

        List<com.taskflow.backend.project.entity.Project> projects =
                projectRepository.findByOrganizationId(organizationId);

        long totalProjects = projects.size();
        long activeProjects = projects.stream()
                .filter(p -> "ACTIVE".equals(p.getStatus())).count();

        List<com.taskflow.backend.task.entity.Task> allTasks = projects.stream()
                .flatMap(p -> taskRepository.findByProjectId(p.getId()).stream())
                .toList();

        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream().filter(t -> "DONE".equals(t.getStatus())).count();
        long inProgressTasks = allTasks.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long overdueTasks = allTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getDueDate().isBefore(LocalDateTime.now())
                        && !"DONE".equals(t.getStatus()))
                .count();

        long totalMembers = organizationMemberRepository.findByOrganizationId(organizationId).size();

        long activeSprints = projects.stream()
                .flatMap(p -> sprintRepository.findByProjectId(p.getId()).stream())
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .count();

        // Tasks by status
        Map<String, Long> tasksByStatus = new HashMap<>();
        allTasks.forEach(t -> tasksByStatus.merge(t.getStatus(), 1L, Long::sum));

        // Tasks by priority
        Map<String, Long> tasksByPriority = new HashMap<>();
        allTasks.forEach(t -> tasksByPriority.merge(t.getPriority(), 1L, Long::sum));

        return DashboardMetrics.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .overdueTasks(overdueTasks)
                .totalMembers(totalMembers)
                .activeSprints(activeSprints)
                .tasksByStatus(tasksByStatus)
                .tasksByPriority(tasksByPriority)
                .build();
    }

    @CacheEvict(value = "analytics", key = "'dashboard:' + #organizationId")
    public void evictDashboardCache(UUID organizationId) {
        log.info("Evicting analytics cache for org: {}", organizationId);
    }
}
