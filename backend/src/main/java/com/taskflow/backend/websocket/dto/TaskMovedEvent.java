package com.taskflow.backend.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskMovedEvent {
    private UUID taskId;
    private UUID projectId;
    private String newStatus;
    private Double newPosition;
    private Integer version;
}
