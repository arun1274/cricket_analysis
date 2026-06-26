package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.MatchAssessmentRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.MatchAssessment;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
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
    private final CoachRepository coachRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<MatchAssessment> saveAssessment(
            @RequestBody MatchAssessmentRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Coach information is missing from authentication."
            );
        }

        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Player not found."
                ));

        // Verify authorization
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Coach not found."
                ));

        boolean authorized = false;
        if (player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId())) {
            authorized = true;
        } else if (player.getName() != null && player.getName().equalsIgnoreCase(managedCoach.getName())) {
            authorized = true;
        }

        if (!authorized) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "You are not authorized to assess this player."
            );
        }

        // Calculate MPI
        double mpi = (request.getTechnicalExecution() + request.getDecisionMaking() + request.getGameAwareness() +
                request.getPressureHandling() + request.getTeamContribution() + request.getMatchImpact()) / 6.0;

        java.time.LocalDate assessmentDate = request.getDate() != null ? request.getDate() : java.time.LocalDate.now();

        MatchAssessment assessment = MatchAssessment.builder()
                .player(player)
                .coach(managedCoach)
                .date(assessmentDate)
                .technicalExecution(request.getTechnicalExecution())
                .decisionMaking(request.getDecisionMaking())
                .gameAwareness(request.getGameAwareness())
                .pressureHandling(request.getPressureHandling())
                .teamContribution(request.getTeamContribution())
                .matchImpact(request.getMatchImpact())
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
        boolean authorized = (player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId())) ||
                (player.getName() != null && player.getName().equalsIgnoreCase(managedCoach.getName()));
        if (!authorized) {
            throw new RuntimeException("Unauthorized");
        }

        return ResponseEntity.ok(matchAssessmentRepository.findByPlayerId(playerId));
    }
}
