package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Organization;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/organization")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final CoachRepository coachRepository;

    @GetMapping("/details")
    public ResponseEntity<Organization> getDetails(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            throw new RuntimeException("Coach does not belong to an organization");
        }

        return ResponseEntity.ok(managedCoach.getOrganization());
    }

    @GetMapping("/coaches")
    public ResponseEntity<List<Coach>> getCoaches(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            throw new RuntimeException("Coach does not belong to an organization");
        }

        if (managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized: Only Organization Admins can access coaches list");
        }

        // Return all coaches in the same organization (excluding the current admin coach)
        List<Coach> coaches = coachRepository.findByOrganizationId(managedCoach.getOrganization().getId());
        return ResponseEntity.ok(coaches);
    }

    @PostMapping("/regenerate-join-code")
    @Transactional
    public ResponseEntity<Map<String, String>> regenerateJoinCode(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            throw new RuntimeException("Coach does not belong to an organization");
        }

        if (managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized: Only Organization Admins can regenerate join code");
        }

        Organization org = managedCoach.getOrganization();
        String newCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        org.setJoinCode(newCode);
        organizationRepository.save(org);

        return ResponseEntity.ok(Map.of("joinCode", newCode));
    }

    @PostMapping("/coaches/{coachId}/approve")
    @Transactional
    public ResponseEntity<Void> approveCoach(
            @PathVariable Long coachId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null || managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        Coach targetCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach to approve not found"));

        if (targetCoach.getOrganization() == null || !targetCoach.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
            throw new RuntimeException("Coach belongs to a different organization");
        }

        targetCoach.setApprovalStatus("APPROVED");
        coachRepository.save(targetCoach);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/coaches/{coachId}/reject")
    @Transactional
    public ResponseEntity<Void> rejectCoach(
            @PathVariable Long coachId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null || managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        Coach targetCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach to reject not found"));

        if (targetCoach.getOrganization() == null || !targetCoach.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
            throw new RuntimeException("Coach belongs to a different organization");
        }

        targetCoach.setApprovalStatus("REJECTED");
        coachRepository.save(targetCoach);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/coaches/{coachId}/remove")
    @Transactional
    public ResponseEntity<Void> removeCoach(
            @PathVariable Long coachId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null || managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        Coach targetCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach to remove not found"));

        if (targetCoach.getOrganization() == null || !targetCoach.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
            throw new RuntimeException("Coach belongs to a different organization");
        }

        // Decouple coach from organization
        targetCoach.setOrganization(null);
        targetCoach.setApprovalStatus(null);
        coachRepository.save(targetCoach);

        return ResponseEntity.ok().build();
    }
}
