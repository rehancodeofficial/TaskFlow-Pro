package com.taskflow.backend.comment.service;

import com.taskflow.backend.comment.dto.CreateCommentRequest;
import com.taskflow.backend.comment.entity.Comment;
import com.taskflow.backend.comment.repository.CommentRepository;
import com.taskflow.backend.common.exception.BusinessException;
import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.common.util.TenantContext;
import com.taskflow.backend.task.entity.Task;
import com.taskflow.backend.task.repository.TaskRepository;
import com.taskflow.backend.user.entity.User;
import com.taskflow.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional
    public Comment createComment(UUID taskId, CreateCommentRequest request, UUID authorId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Task does not belong to the current organization");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .task(task)
                .user(author)
                .content(request.getContent())
                .build();

        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByTask(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(TenantContext.getTenantId())) {
            throw new BusinessException("Task does not belong to the current organization");
        }

        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional
    public void deleteComment(UUID commentId, UUID requesterId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getUser().getId().equals(requesterId)) {
            throw new BusinessException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }
}
