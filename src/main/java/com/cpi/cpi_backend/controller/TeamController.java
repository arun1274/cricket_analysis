package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.TeamRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;

    @GetMapping
    public ResponseEntity<List<Team>> getMyTeams(@AuthenticationPrincipal Coach currentCoach) {
        return ResponseEntity.ok(teamRepository.findByCoachId(currentCoach.getId()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Team> createTeam(
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        // Re-fetch coach within the current persistence context to avoid detached entity issues
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        // Inherit organizationId from the coach; default to 1 for legacy accounts
        Long orgId = managedCoach.getOrganizationId() != null ? managedCoach.getOrganizationId() : 1L;

        Team team = Team.builder()
                .name(request.getName())
                .level(request.getLevel())
                .coach(managedCoach)
                .teamCpiScore(0.0)
                .organizationId(orgId)
                .build();
        return ResponseEntity.ok(teamRepository.save(team));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Team> updateTeam(
            @PathVariable Long id,
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getCoach().getId().equals(currentCoach.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        team.setName(request.getName());
        team.setLevel(request.getLevel());

        return ResponseEntity.ok(teamRepository.save(team));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getCoach().getId().equals(currentCoach.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Delete players of the team first to prevent foreign key violations
        List<Player> players = playerRepository.findByTeamId(id);
        playerRepository.deleteAll(players);

        teamRepository.delete(team);
        return ResponseEntity.noContent().build();
    }
}
