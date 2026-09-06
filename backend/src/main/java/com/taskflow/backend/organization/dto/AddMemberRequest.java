package com.taskflow.backend.organization.dto;

import jakarta.validation.constraints.NotBlank;
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
public class AddMemberRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;
    
    @NotBlank(message = "Role is required")
    private String role;
}
