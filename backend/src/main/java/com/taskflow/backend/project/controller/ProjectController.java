package com.taskflow.backend.project.controller;

import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.project.dto.CreateProjectRequest;
import com.taskflow.backend.project.entity.Project;
import com.taskflow.backend.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<Project>> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project created successfully", projectService.createProject(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Project>>> getProjects() {
        return ResponseEntity.ok(ApiResponse.success("Projects retrieved", projectService.getProjectsForCurrentTenant()));
    }
}
