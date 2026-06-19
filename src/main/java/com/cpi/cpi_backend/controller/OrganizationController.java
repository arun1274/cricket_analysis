package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.CoachSummaryResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Organization;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.OrganizationRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
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
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;

    @GetMapping("/details")
    public ResponseEntity<Organization> getDetails(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            throw new RuntimeException("Coach does not belong to an organization");
        }

        return ResponseEntity.ok(managedCoach.getOrganization());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            throw new RuntimeException("Coach does not belong to an organization");
        }

        Long orgId = managedCoach.getOrganization().getId();
        int totalCoaches = coachRepository.findByOrganizationId(orgId).size();
        int totalTeams = teamRepository.findByOrganizationId(orgId).size();
        int totalPlayers = playerRepository.findByOrganizationId(orgId).size();

        return ResponseEntity.ok(Map.of(
                "totalCoaches", totalCoaches,
                "totalTeams", totalTeams,
                "totalPlayers", totalPlayers
        ));
    }

    @GetMapping("/coaches")
    public ResponseEntity<List<CoachSummaryResponse>> getCoaches(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            throw new RuntimeException("Coach does not belong to an organization");
        }

        if (managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized: Only Organization Admins can access coaches list");
        }

        List<Coach> coaches = coachRepository.findByOrganizationId(managedCoach.getOrganization().getId());
        List<CoachSummaryResponse> summaries = coaches.stream().map(coach -> {
            var teams = teamRepository.findByCoachId(coach.getId());
            int teamsCount = teams.size();
            int playersCount = playerRepository.findByCreatorCoachId(coach.getId()).size();

            // Mock last activity for premium experience
            String lastActivity = "Today";
            if (teamsCount == 0) {
                lastActivity = "Never";
            } else if (teamsCount == 1) {
                lastActivity = "Yesterday";
            } else {
                lastActivity = "2 hours ago";
            }

            return CoachSummaryResponse.builder()
                    .id(coach.getId())
                    .name(coach.getName())
                    .email(coach.getEmail())
                    .role(coach.getRole().name())
                    .approvalStatus(coach.getApprovalStatus())
                    .teamsCount(teamsCount)
                    .playersCount(playersCount)
                    .lastActivity(lastActivity)
                    .build();
        }).toList();

        return ResponseEntity.ok(summaries);
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

    @GetMapping("/coaches/{coachId}")
    public ResponseEntity<com.cpi.cpi_backend.dto.CoachDetailsResponse> getCoachDetails(
            @PathVariable Long coachId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null || managedCoach.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        Coach targetCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Target coach not found"));

        if (targetCoach.getOrganization() == null || !targetCoach.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
            throw new RuntimeException("Coach belongs to a different organization");
        }

        var teams = teamRepository.findByCoachId(targetCoach.getId());
        int totalTeams = teams.size();
        double totalCpi = 0;
        java.util.Set<Long> uniquePlayerIds = new java.util.HashSet<>();

        List<com.cpi.cpi_backend.dto.CoachDetailsResponse.TeamDetail> teamDetails = new java.util.ArrayList<>();
        for (var team : teams) {
            var teamPlayers = playerRepository.findByTeamId(team.getId());
            int pCount = teamPlayers.size();
            for (var p : teamPlayers) {
                uniquePlayerIds.add(p.getId());
            }
            totalCpi += team.getTeamCpiScore() != null ? team.getTeamCpiScore() : 0.0;

            teamDetails.add(com.cpi.cpi_backend.dto.CoachDetailsResponse.TeamDetail.builder()
                    .id(team.getId())
                    .name(team.getName())
                    .level(team.getLevel())
                    .teamCpiScore(team.getTeamCpiScore() != null ? team.getTeamCpiScore() : 0.0)
                    .playersCount(pCount)
                    .build());
        }
        int totalPlayers = playerRepository.findByCreatorCoachId(targetCoach.getId()).size();

        double averageCpi = totalTeams > 0 ? (totalCpi / totalTeams) : 0.0;

        // Mock practice and match stats for the premium coach detailed subview
        double averagePpi = totalTeams > 0 ? 76.5 : 0.0;
        double averageMpi = totalTeams > 0 ? 78.2 : 0.0;

        return ResponseEntity.ok(com.cpi.cpi_backend.dto.CoachDetailsResponse.builder()
                .id(targetCoach.getId())
                .name(targetCoach.getName())
                .email(targetCoach.getEmail())
                .role(targetCoach.getRole().name())
                .approvalStatus(targetCoach.getApprovalStatus())
                .totalTeams(totalTeams)
                .totalPlayers(totalPlayers)
                .averageCpi(averageCpi)
                .averagePpi(averagePpi)
                .averageMpi(averageMpi)
                .teams(teamDetails)
                .build());
    }
}
