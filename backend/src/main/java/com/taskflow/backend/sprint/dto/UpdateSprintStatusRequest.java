package com.taskflow.backend.sprint.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateSprintStatusRequest {
    @NotBlank(message = "Status is required")
    private String status; // ACTIVE, COMPLETED, CANCELLED
}
