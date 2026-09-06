package com.taskflow.backend.sprint.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateSprintRequest {
    @NotBlank(message = "Sprint name is required")
    private String name;
    private String goal;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
