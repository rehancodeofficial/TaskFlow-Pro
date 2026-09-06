package com.taskflow.backend.websocket.listener;

import com.taskflow.backend.websocket.dto.TaskMovedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KanbanEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleTaskMovedEvent(TaskMovedEvent event) {
        // Broadcast the event to all clients subscribed to the project's topic
        String destination = "/topic/projects/" + event.getProjectId() + "/tasks";
        messagingTemplate.convertAndSend(destination, event);
    }
}
