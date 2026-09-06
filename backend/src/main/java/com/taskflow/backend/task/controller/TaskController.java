package com.taskflow.backend.task.controller;

import com.taskflow.backend.auth.security.UserDetailsImpl;
import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.task.dto.CreateTaskRequest;
import com.taskflow.backend.task.dto.UpdateTaskStatusRequest;
import com.taskflow.backend.task.entity.Task;
import com.taskflow.backend.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<Task>> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        return ResponseEntity.ok(ApiResponse.success(
                "Task created successfully", 
                taskService.createTask(projectId, request, userDetails.getUser().getId())
        ));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<List<Task>>> getTasksByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tasks retrieved", 
                taskService.getTasksByProject(projectId)
        ));
    }

    @PatchMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<Task>> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        
        return ResponseEntity.ok(ApiResponse.success(
                "Task status updated", 
                taskService.updateTaskStatus(id, request)
        ));
    }
}
