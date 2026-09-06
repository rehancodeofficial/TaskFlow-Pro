package com.taskflow.backend.kanban.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MoveTaskRequest {
    @NotBlank(message = "New status is required")
    private String status;
    
    @NotNull(message = "New position is required")
    private Double position;
    
    private Integer version;
}
