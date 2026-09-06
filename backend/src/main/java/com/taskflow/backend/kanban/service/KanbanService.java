package com.taskflow.backend.kanban.service;

import com.taskflow.backend.common.exception.BusinessException;
import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.kanban.dto.CreateColumnRequest;
import com.taskflow.backend.kanban.dto.MoveTaskRequest;
import com.taskflow.backend.kanban.entity.KanbanColumn;
import com.taskflow.backend.kanban.repository.KanbanColumnRepository;
import com.taskflow.backend.project.entity.Project;
import com.taskflow.backend.project.repository.ProjectRepository;
import com.taskflow.backend.task.entity.Task;
import com.taskflow.backend.task.repository.TaskRepository;
import com.taskflow.backend.websocket.dto.TaskMovedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KanbanService {

    private final KanbanColumnRepository kanbanColumnRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public KanbanColumn createColumn(UUID projectId, CreateColumnRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Project does not belong to the current organization");
        }

        KanbanColumn column = KanbanColumn.builder()
                .project(project)
                .name(request.getName())
                .position(request.getPosition() != null ? request.getPosition() : 0.0)
                .build();
        
        return kanbanColumnRepository.save(column);
    }

    public List<KanbanColumn> getColumnsByProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Project does not belong to the current organization");
        }

        return kanbanColumnRepository.findByProjectIdOrderByPositionAsc(projectId);
    }

    @Transactional
    public Task moveTask(UUID taskId, MoveTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Task does not belong to the current organization");
        }

        if (request.getVersion() != null && !task.getVersion().equals(request.getVersion())) {
            throw new BusinessException("Optimistic locking failure: Task was updated by another user");
        }

        task.setStatus(request.getStatus());
        task.setPosition(request.getPosition());
        
        Task updatedTask = taskRepository.save(task);

        // Publish event for WebSockets
        eventPublisher.publishEvent(TaskMovedEvent.builder()
                .taskId(updatedTask.getId())
                .projectId(updatedTask.getProject().getId())
                .newStatus(updatedTask.getStatus())
                .newPosition(updatedTask.getPosition())
                .version(updatedTask.getVersion())
                .build());

        return updatedTask;
    }
}
