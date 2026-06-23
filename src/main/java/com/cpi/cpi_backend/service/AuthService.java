package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.dto.AuthenticationRequest;
import com.cpi.cpi_backend.dto.AuthenticationResponse;
import com.cpi.cpi_backend.dto.RegisterRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CoachRepository repository;
    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        if (!request.isCreateOrganization()) {
            if (request.getInvitationCode() == null || request.getInvitationCode().trim().isEmpty()) {
                throw new RuntimeException("Invitation code is required for player registration");
            }
            
            var player = playerRepository.findByInvitationCode(request.getInvitationCode())
                    .orElseThrow(() -> new RuntimeException("Invalid invitation code"));
            
            if (Boolean.TRUE.equals(player.getInvitationCodeActivated())) {
                throw new RuntimeException("Invitation code has already been activated");
            }

            request.setName(player.getName());

            var user = Coach.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .build();
            repository.save(user);

            player.setInvitationCodeActivated(true);
            playerRepository.save(player);

            var jwtToken = jwtService.generateToken(user);
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .build();
        } else {
            var user = Coach.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.ADMIN)
                    .build();
            repository.save(user);

            var jwtToken = jwtService.generateToken(user);
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .build();
        }
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public java.util.Map<String, Object> validateCode(String code) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (code == null || code.trim().isEmpty()) {
            response.put("valid", false);
            response.put("message", "Code cannot be empty");
            return response;
        }

        var playerOpt = playerRepository.findByInvitationCode(code.trim());
        if (playerOpt.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Invalid invitation code");
            return response;
        }

        var player = playerOpt.get();
        if (Boolean.TRUE.equals(player.getInvitationCodeActivated())) {
            response.put("valid", false);
            response.put("message", "Invitation code has already been activated");
            return response;
        }

        response.put("valid", true);
        response.put("playerName", player.getName());
        return response;
    }
}
