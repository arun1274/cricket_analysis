package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.AuthenticationRequest;
import com.cpi.cpi_backend.dto.AuthenticationResponse;
import com.cpi.cpi_backend.dto.RegisterRequest;
import com.cpi.cpi_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/signup")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request
    ) {
        try {
            return ResponseEntity.ok(service.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(409)
                    .body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @org.springframework.web.bind.annotation.GetMapping("/validate-code")
    public ResponseEntity<java.util.Map<String, Object>> validateCode(
            @org.springframework.web.bind.annotation.RequestParam String code
    ) {
        return ResponseEntity.ok(service.validateCode(code));
    }
}