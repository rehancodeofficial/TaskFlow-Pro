package com.taskflow.backend.sprint.service;

import com.taskflow.backend.common.exception.BusinessException;
import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.project.entity.Project;
import com.taskflow.backend.project.repository.ProjectRepository;
import com.taskflow.backend.sprint.dto.AssignTaskToSprintRequest;
import com.taskflow.backend.sprint.dto.CreateSprintRequest;
import com.taskflow.backend.sprint.dto.UpdateSprintStatusRequest;
import com.taskflow.backend.sprint.entity.Sprint;
import com.taskflow.backend.sprint.repository.SprintRepository;
import com.taskflow.backend.task.entity.Task;
import com.taskflow.backend.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public Sprint createSprint(UUID projectId, CreateSprintRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Project does not belong to the current organization");
        }

        Sprint sprint = Sprint.builder()
                .project(project)
                .name(request.getName())
                .goal(request.getGoal())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status("PLANNED")
                .build();

        return sprintRepository.save(sprint);
    }

    public List<Sprint> getSprintsByProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Project does not belong to the current organization");
        }

        return sprintRepository.findByProjectId(projectId);
    }

    @Transactional
    public Sprint updateSprintStatus(UUID sprintId, UpdateSprintStatusRequest request) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

        if (!sprint.getProject().getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Sprint does not belong to the current organization");
        }

        String newStatus = request.getStatus();

        if ("ACTIVE".equals(newStatus)) {
            // Ensure no other sprint is active on this project
            sprintRepository.findByProjectIdAndStatus(sprint.getProject().getId(), "ACTIVE")
                    .ifPresent(active -> {
                        throw new BusinessException("A sprint is already active in this project. Complete or cancel it first.");
                    });
        }

        if ("COMPLETED".equals(newStatus)) {
            // Move all incomplete tasks out of the sprint to backlog (unassign sprint_id)
            List<Task> incompleteTasks = taskRepository.findByProjectId(sprint.getProject().getId())
                    .stream()
                    .filter(t -> sprintId.equals(t.getSprintId()) && !"DONE".equals(t.getStatus()))
                    .toList();

            incompleteTasks.forEach(t -> {
                t.setSprintId(null);
                t.setStatus("BACKLOG");
            });
            taskRepository.saveAll(incompleteTasks);
            log.info("Moved {} incomplete tasks to backlog on sprint completion", incompleteTasks.size());
        }

        sprint.setStatus(newStatus);
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Task assignTaskToSprint(UUID sprintId, AssignTaskToSprintRequest request) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

        if (!sprint.getProject().getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Sprint does not belong to the current organization");
        }

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Task does not belong to the current organization");
        }

        task.setSprintId(sprintId);
        return taskRepository.save(task);
    }
}
