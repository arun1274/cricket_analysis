package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.MatchAssessmentRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.MatchAssessment;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchAssessmentRepository matchAssessmentRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<MatchAssessment> saveAssessment(
            @RequestBody MatchAssessmentRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // Verify authorization
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        boolean authorized = false;
        if (managedCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN) {
            authorized = player.getOrganization() != null && managedCoach.getOrganization() != null &&
                    player.getOrganization().getId().equals(managedCoach.getOrganization().getId());
        } else {
            authorized = player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId());
        }
        if (!authorized) {
            throw new RuntimeException("Unauthorized");
        }

        // Calculate MPI
        double mpi = (request.getShotSelection() + request.getTemperament() + request.getRunningBetweenWickets() +
                request.getBowlingAccuracy() + request.getFieldingEffort() + request.getGameAwareness()) / 6.0;

        MatchAssessment assessment = MatchAssessment.builder()
                .player(player)
                .date(request.getDate())
                .shotSelection(request.getShotSelection())
                .temperament(request.getTemperament())
                .runningBetweenWickets(request.getRunningBetweenWickets())
                .bowlingAccuracy(request.getBowlingAccuracy())
                .fieldingEffort(request.getFieldingEffort())
                .gameAwareness(request.getGameAwareness())
                .mpiScore(mpi)
                .notes(request.getNotes())
                .build();

        MatchAssessment saved = matchAssessmentRepository.save(assessment);

        // Recalculate Player average MPI
        List<MatchAssessment> playerAssessments = matchAssessmentRepository.findByPlayerId(player.getId());
        double avgMpi = playerAssessments.stream()
                .mapToDouble(MatchAssessment::getMpiScore)
                .average()
                .orElse(0.0);
        player.setMpiScore(avgMpi);
        playerRepository.save(player);

        // Recalculate Team average CPI score for all teams the player belongs to
        for (Team team : player.getTeams()) {
            List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
            double teamCpi = teamPlayers.stream()
                    .mapToDouble(p -> ((p.getPpiScore() != null ? p.getPpiScore() : 0.0) + (p.getMpiScore() != null ? p.getMpiScore() : 0.0)) / 2.0)
                    .average()
                    .orElse(0.0);
            team.setTeamCpiScore(teamCpi);
            teamRepository.save(team);
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<MatchAssessment>> getPlayerAssessments(
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        boolean authorized = false;
        if (managedCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN) {
            authorized = player.getOrganization() != null && managedCoach.getOrganization() != null &&
                    player.getOrganization().getId().equals(managedCoach.getOrganization().getId());
        } else {
            authorized = player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId());
        }
        if (!authorized) {
            throw new RuntimeException("Unauthorized");
        }

        return ResponseEntity.ok(matchAssessmentRepository.findByPlayerId(playerId));
    }
}
