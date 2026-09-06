package com.taskflow.backend.task.service;

import com.taskflow.backend.common.exception.BusinessException;
import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.organization.entity.Organization;
import com.taskflow.backend.organization.repository.OrganizationRepository;
import com.taskflow.backend.project.entity.Project;
import com.taskflow.backend.project.repository.ProjectRepository;
import com.taskflow.backend.task.dto.CreateTaskRequest;
import com.taskflow.backend.task.dto.UpdateTaskStatusRequest;
import com.taskflow.backend.task.entity.Task;
import com.taskflow.backend.task.repository.TaskRepository;
import com.taskflow.backend.user.entity.User;
import com.taskflow.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Task createTask(UUID projectId, CreateTaskRequest request, UUID reporterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Project does not belong to the current organization");
        }

        Organization org = organizationRepository.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter not found"));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        }

        // Generate task number based on project key and count
        long taskCount = taskRepository.countByProjectId(projectId) + 1;
        String taskNumber = project.getKey() + "-" + taskCount;

        Task task = Task.builder()
                .organization(org)
                .project(project)
                .taskNumber(taskNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .status("TODO")
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .assignee(assignee)
                .reporter(reporter)
                .dueDate(request.getDueDate())
                .build();
        
        return taskRepository.save(task);
    }

    public List<Task> getTasksByProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (!project.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Project does not belong to the current organization");
        }
        
        return taskRepository.findByProjectId(projectId);
    }

    @Transactional
    public Task updateTaskStatus(UUID taskId, UpdateTaskStatusRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Task does not belong to the current organization");
        }

        if (request.getVersion() != null && !task.getVersion().equals(request.getVersion())) {
            throw new BusinessException("Optimistic locking failure: Task was updated by another user");
        }

        task.setStatus(request.getStatus());
        return taskRepository.save(task);
    }
}
