package com.taskflow.backend.auth.controller;

import com.taskflow.backend.auth.dto.AuthResponse;
import com.taskflow.backend.auth.dto.LoginRequest;
import com.taskflow.backend.auth.dto.RegisterRequest;
import com.taskflow.backend.auth.dto.TokenRefreshRequest;
import com.taskflow.backend.auth.service.AuthService;
import com.taskflow.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authService.refreshToken(request.getRefreshToken())));
    }
}
