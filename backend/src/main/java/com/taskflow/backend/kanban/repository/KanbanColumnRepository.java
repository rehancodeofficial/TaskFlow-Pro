package com.taskflow.backend.kanban.repository;

import com.taskflow.backend.kanban.entity.KanbanColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KanbanColumnRepository extends JpaRepository<KanbanColumn, UUID> {
    List<KanbanColumn> findByProjectIdOrderByPositionAsc(UUID projectId);
}
