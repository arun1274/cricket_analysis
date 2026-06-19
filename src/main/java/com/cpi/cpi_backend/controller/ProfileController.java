package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.entity.Coach;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal Coach currentCoach) {
        if (currentCoach == null) {
            return ResponseEntity.status(401).build();
        }
        
        return ResponseEntity.ok(Map.of(
                "id", currentCoach.getId(),
                "name", currentCoach.getName(),
                "email", currentCoach.getEmail(),
                "role", currentCoach.getRole().name(),
                "approvalStatus", currentCoach.getApprovalStatus() != null ? currentCoach.getApprovalStatus() : "APPROVED",
                "organization", currentCoach.getOrganization() != null ? Map.of(
                        "id", currentCoach.getOrganization().getId(),
                        "name", currentCoach.getOrganization().getName(),
                        "joinCode", currentCoach.getOrganization().getJoinCode() != null ? currentCoach.getOrganization().getJoinCode() : ""
                ) : Map.of()
        ));
    }
}
