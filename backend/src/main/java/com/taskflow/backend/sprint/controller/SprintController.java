package com.taskflow.backend.sprint.controller;

import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.sprint.dto.AssignTaskToSprintRequest;
import com.taskflow.backend.sprint.dto.CreateSprintRequest;
import com.taskflow.backend.sprint.dto.UpdateSprintStatusRequest;
import com.taskflow.backend.sprint.entity.Sprint;
import com.taskflow.backend.sprint.service.SprintService;
import com.taskflow.backend.task.entity.Task;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping("/projects/{projectId}/sprints")
    public ResponseEntity<ApiResponse<Sprint>> createSprint(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateSprintRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Sprint created successfully",
                sprintService.createSprint(projectId, request)
        ));
    }

    @GetMapping("/projects/{projectId}/sprints")
    public ResponseEntity<ApiResponse<List<Sprint>>> getSprintsByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Sprints retrieved",
                sprintService.getSprintsByProject(projectId)
        ));
    }

    @PatchMapping("/sprints/{id}/status")
    public ResponseEntity<ApiResponse<Sprint>> updateSprintStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSprintStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Sprint status updated",
                sprintService.updateSprintStatus(id, request)
        ));
    }

    @PostMapping("/sprints/{id}/tasks")
    public ResponseEntity<ApiResponse<Task>> assignTaskToSprint(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTaskToSprintRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task assigned to sprint",
                sprintService.assignTaskToSprint(id, request)
        ));
    }
}
