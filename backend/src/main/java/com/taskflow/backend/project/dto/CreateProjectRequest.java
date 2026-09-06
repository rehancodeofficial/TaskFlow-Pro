package com.taskflow.backend.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateProjectRequest {
    @NotBlank(message = "Project name is required")
    private String name;
    
    @NotBlank(message = "Project key is required")
    private String key;
    
    private String description;
    
    private UUID teamId;
}
