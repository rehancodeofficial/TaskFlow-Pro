package com.taskflow.backend.kanban.controller;

import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.kanban.dto.CreateColumnRequest;
import com.taskflow.backend.kanban.dto.MoveTaskRequest;
import com.taskflow.backend.kanban.entity.KanbanColumn;
import com.taskflow.backend.kanban.service.KanbanService;
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
public class KanbanController {

    private final KanbanService kanbanService;

    @PostMapping("/projects/{projectId}/columns")
    public ResponseEntity<ApiResponse<KanbanColumn>> createColumn(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateColumnRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Kanban column created", 
                kanbanService.createColumn(projectId, request)
        ));
    }

    @GetMapping("/projects/{projectId}/columns")
    public ResponseEntity<ApiResponse<List<KanbanColumn>>> getColumnsByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Kanban columns retrieved", 
                kanbanService.getColumnsByProject(projectId)
        ));
    }

    @PutMapping("/tasks/{taskId}/move")
    public ResponseEntity<ApiResponse<Task>> moveTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody MoveTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task moved successfully", 
                kanbanService.moveTask(taskId, request)
        ));
    }
}
