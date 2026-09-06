package com.taskflow.backend.sprint.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssignTaskToSprintRequest {
    @NotNull(message = "Task ID is required")
    private UUID taskId;
}
