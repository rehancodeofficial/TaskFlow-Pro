package com.taskflow.backend.organization.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrganizationRequest {
    @NotBlank(message = "Organization name is required")
    private String name;
    
    @NotBlank(message = "Organization slug is required")
    private String slug;
    
    private String description;
}
