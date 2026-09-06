package com.taskflow.backend.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrganizationResponse {
    private UUID id;
    private String name;
    private String slug;
    private String logoUrl;
    private String description;
    private LocalDateTime createdAt;
}
