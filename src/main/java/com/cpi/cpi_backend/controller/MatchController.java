package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.MatchAssessmentRequest;
import com.cpi.cpi_backend.dto.MatchSessionRequest;
import com.cpi.cpi_backend.dto.MatchSessionDetailsResponse;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.MatchAssessment;
import com.cpi.cpi_backend.entity.MatchSession;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.MatchAssessmentRepository;
import com.cpi.cpi_backend.repository.MatchSessionRepository;
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
    private final MatchSessionRepository matchSessionRepository;

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
        if (player.getOrganization() != null && managedCoach.getOrganization() != null &&
                player.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
            authorized = true;
        } else if (player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId())) {
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
            authorized = (player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId())) ||
                    (player.getName() != null && player.getName().equalsIgnoreCase(managedCoach.getName()) &&
                     player.getOrganization() != null && managedCoach.getOrganization() != null &&
                     player.getOrganization().getId().equals(managedCoach.getOrganization().getId()));
        }
        if (!authorized) {
            throw new RuntimeException("Unauthorized");
        }

        return ResponseEntity.ok(matchAssessmentRepository.findByPlayerId(playerId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<MatchSession>> getSessions(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN) {
            return ResponseEntity.ok(matchSessionRepository.findByOrganizationId(managedCoach.getOrganization().getId()));
        } else {
            return ResponseEntity.ok(matchSessionRepository.findByCoachId(managedCoach.getId()));
        }
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<MatchSessionDetailsResponse> getSessionDetails(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        MatchSession session = matchSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Match session not found"));

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() != com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (!session.getTeam().getCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized");
            }
        }

        List<MatchAssessment> assessments = matchAssessmentRepository.findBySessionId(sessionId);

        return ResponseEntity.ok(MatchSessionDetailsResponse.builder()
                .session(session)
                .assessments(assessments)
                .build());
    }

    @PostMapping("/sessions")
    @Transactional
    public ResponseEntity<MatchSession> createSession(
            @RequestBody MatchSessionRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Match name is required."
            );
        }
        if (request.getDate() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Match date is required."
            );
        }
        if (request.getOpponent() == null || request.getOpponent().trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Opponent name is required."
            );
        }

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (currentCoach == null || currentCoach.getId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Coach info missing."
            );
        }
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Coach not found."
                ));

        if (managedCoach.getRole() != com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (!team.getCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized");
            }
        }

        MatchSession session = MatchSession.builder()
                .team(team)
                .name(request.getName())
                .opponent(request.getOpponent())
                .venue(request.getVenue())
                .date(request.getDate())
                .playersAssessed(request.getAssessments().size())
                .averageMpi(0.0)
                .build();
        session = matchSessionRepository.save(session);

        double totalSessionMpi = 0.0;
        int count = 0;

        for (MatchSessionRequest.AssessmentDto assDto : request.getAssessments()) {
            Player player = playerRepository.findById(assDto.getPlayerId())
                    .orElseThrow(() -> new RuntimeException("Player not found"));

            double mpi = (assDto.getTechnicalExecution() + assDto.getDecisionMaking() + assDto.getGameAwareness() +
                    assDto.getPressureHandling() + assDto.getTeamContribution() + assDto.getMatchImpact()) / 6.0;

            MatchAssessment assessment = MatchAssessment.builder()
                    .player(player)
                    .session(session)
                    .date(request.getDate())
                    .technicalExecution(assDto.getTechnicalExecution())
                    .decisionMaking(assDto.getDecisionMaking())
                    .gameAwareness(assDto.getGameAwareness())
                    .pressureHandling(assDto.getPressureHandling())
                    .teamContribution(assDto.getTeamContribution())
                    .matchImpact(assDto.getMatchImpact())
                    .mpiScore(mpi)
                    .notes(assDto.getNotes())
                    .build();

            matchAssessmentRepository.save(assessment);
            totalSessionMpi += mpi;
            count++;

            // Recalculate Player average MPI
            List<MatchAssessment> playerAssessments = matchAssessmentRepository.findByPlayerId(player.getId());
            double avgMpi = playerAssessments.stream()
                    .mapToDouble(MatchAssessment::getMpiScore)
                    .average()
                    .orElse(0.0);
            player.setMpiScore(avgMpi);
            playerRepository.save(player);

            // Recalculate Team average CPI score for all teams the player belongs to
            for (Team t : player.getTeams()) {
                List<Player> teamPlayers = playerRepository.findByTeamId(t.getId());
                double teamCpi = teamPlayers.stream()
                        .mapToDouble(p -> ((p.getPpiScore() != null ? p.getPpiScore() : 0.0) + (p.getMpiScore() != null ? p.getMpiScore() : 0.0)) / 2.0)
                        .average()
                        .orElse(0.0);
                t.setTeamCpiScore(teamCpi);
                teamRepository.save(t);
            }
        }

        if (count > 0) {
            session.setAverageMpi(totalSessionMpi / count);
            session = matchSessionRepository.save(session);
        }

        return ResponseEntity.ok(session);
    }
}
