package com.taskflow.backend.auth.service;

import com.taskflow.backend.auth.dto.AuthResponse;
import com.taskflow.backend.auth.dto.LoginRequest;
import com.taskflow.backend.auth.dto.RegisterRequest;
import com.taskflow.backend.auth.entity.RefreshToken;
import com.taskflow.backend.auth.repository.RefreshTokenRepository;
import com.taskflow.backend.auth.security.JwtService;
import com.taskflow.backend.auth.security.UserDetailsImpl;
import com.taskflow.backend.common.exception.BusinessException;
import com.taskflow.backend.common.exception.ResourceNotFoundException;
import com.taskflow.backend.user.entity.User;
import com.taskflow.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException("Email already in use");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .build();
        
        userRepository.save(user);

        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwtToken = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwtToken = jwtService.generateToken(userDetails);
        
        refreshTokenRepository.deleteByUser(user); // Invalidating old refresh tokens
        RefreshToken refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException("Refresh token not found"));

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException("Refresh token was expired or revoked. Please make a new signin request");
        }

        User user = refreshToken.getUser();
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }
}
