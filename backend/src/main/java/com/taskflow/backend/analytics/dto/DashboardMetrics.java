package com.taskflow.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardMetrics implements Serializable {
    private long totalProjects;
    private long activeProjects;
    private long totalTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long overdueTasks;
    private long totalMembers;
    private long activeSprints;
    private Map<String, Long> tasksByStatus;
    private Map<String, Long> tasksByPriority;
}
