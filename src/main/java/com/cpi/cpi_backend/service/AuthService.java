package com.cpi.cpi_backend.service;

import com.cpi.cpi_backend.dto.AuthenticationRequest;
import com.cpi.cpi_backend.dto.AuthenticationResponse;
import com.cpi.cpi_backend.dto.RegisterRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    private final com.cpi.cpi_backend.repository.OrganizationRepository organizationRepository;

    public AuthenticationResponse register(RegisterRequest request) {
        if (request.isCreateOrganization()) {
            // Option 1: Create Organization
            var org = com.cpi.cpi_backend.entity.Organization.builder()
                    .name(request.getOrganizationName())
                    .type(request.getOrganizationType())
                    .sport(request.getSport())
                    .country(request.getCountry())
                    .city(request.getCity())
                    .description(request.getDescription())
                    .joinCode(java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .build();
            org = organizationRepository.save(org);

            var user = Coach.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.ADMIN) // Admin of organization
                    .approvalStatus("APPROVED") // Auto-approved
                    .organization(org)
                    .build();
            repository.save(user);

            var jwtToken = jwtService.generateToken(user);
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .build();
        } else {
            // Option 2: Join As Player / Standard Coach
            com.cpi.cpi_backend.entity.Organization org;
            String code = request.getJoinCode();
            if (code == null || code.trim().isEmpty()) {
                var list = organizationRepository.findAll();
                if (!list.isEmpty()) {
                    org = list.get(0);
                } else {
                    org = com.cpi.cpi_backend.entity.Organization.builder()
                            .name("Default Academy")
                            .type("Academy")
                            .sport("Cricket")
                            .country("India")
                            .city("Default")
                            .joinCode("DEFAULT")
                            .build();
                    org = organizationRepository.save(org);
                }
            } else {
                org = organizationRepository.findByJoinCode(code.trim().toUpperCase())
                        .orElseThrow(() -> new RuntimeException("Invalid Organization Join Code. Please check and try again."));
            }

            var user = Coach.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER) // Standard Coach / Player
                    .approvalStatus("APPROVED") // Auto-approve for simpler onboarding
                    .organization(org)
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
}
