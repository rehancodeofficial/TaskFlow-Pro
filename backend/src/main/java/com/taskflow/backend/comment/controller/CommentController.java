package com.taskflow.backend.comment.controller;

import com.taskflow.backend.auth.security.UserDetailsImpl;
import com.taskflow.backend.comment.dto.CreateCommentRequest;
import com.taskflow.backend.comment.entity.Comment;
import com.taskflow.backend.comment.service.CommentService;
import com.taskflow.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<ApiResponse<Comment>> createComment(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Comment added",
                commentService.createComment(taskId, request, userDetails.getUser().getId())
        ));
    }

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<ApiResponse<List<Comment>>> getComments(@PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Comments retrieved",
                commentService.getCommentsByTask(taskId)
        ));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        commentService.deleteComment(commentId, userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }
}
