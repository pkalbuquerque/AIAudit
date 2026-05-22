package com.auditflow.controller;

import com.auditflow.dto.request.CreateCommentRequest;
import com.auditflow.dto.response.CommentResponse;
import com.auditflow.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pbc/{pbcItemId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> create(@PathVariable UUID pbcItemId,
                                                  @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(pbcItemId, request));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> findAll(@PathVariable UUID pbcItemId) {
        return ResponseEntity.ok(commentService.findAll(pbcItemId));
    }
}
