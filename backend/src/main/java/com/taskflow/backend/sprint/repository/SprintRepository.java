package com.taskflow.backend.sprint.repository;

import com.taskflow.backend.sprint.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, UUID> {
    List<Sprint> findByProjectId(UUID projectId);
    Optional<Sprint> findByProjectIdAndStatus(UUID projectId, String status);
}
