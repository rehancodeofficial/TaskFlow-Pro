package com.taskflow.backend.activity.service;

import com.taskflow.backend.activity.entity.ActivityLog;
import com.taskflow.backend.activity.repository.ActivityLogRepository;
import com.taskflow.backend.organization.entity.Organization;
import com.taskflow.backend.organization.repository.OrganizationRepository;
import com.taskflow.backend.user.entity.User;
import com.taskflow.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID organizationId, UUID userId, String entityType, UUID entityId,
                    String action, Map<String, Object> metadata) {
        try {
            Organization org = organizationRepository.findById(organizationId).orElse(null);
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

            ActivityLog log = ActivityLog.builder()
                    .organization(org)
                    .user(user)
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .metadata(metadata)
                    .build();

            activityLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to record activity log: {}", e.getMessage());
        }
    }

    public List<ActivityLog> getOrgActivity(UUID organizationId) {
        return activityLogRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
    }

    public List<ActivityLog> getEntityActivity(String entityType, UUID entityId) {
        return activityLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }
}
