package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PracticeAssessmentRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.PracticeAssessment;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.PracticeAssessmentRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;
    private final com.cpi.cpi_backend.repository.PracticeSessionRepository practiceSessionRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<PracticeAssessment> saveAssessment(
            @RequestBody PracticeAssessmentRequest request,
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

        // Calculate PPI
        double ppi = (request.getTechnique() + request.getIntensity() + request.getExecution() +
                request.getAdaptability() + request.getDiscipline() + request.getFocus()) / 6.0;

        PracticeAssessment assessment = PracticeAssessment.builder()
                .player(player)
                .date(request.getDate())
                .technique(request.getTechnique())
                .intensity(request.getIntensity())
                .execution(request.getExecution())
                .adaptability(request.getAdaptability())
                .discipline(request.getDiscipline())
                .focus(request.getFocus())
                .ppiScore(ppi)
                .notes(request.getNotes())
                .build();

        PracticeAssessment saved = practiceAssessmentRepository.save(assessment);

        // Recalculate Player average PPI
        List<PracticeAssessment> playerAssessments = practiceAssessmentRepository.findByPlayerId(player.getId());
        double avgPpi = playerAssessments.stream()
                .mapToDouble(PracticeAssessment::getPpiScore)
                .average()
                .orElse(0.0);
        player.setPpiScore(avgPpi);
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
    public ResponseEntity<List<PracticeAssessment>> getPlayerAssessments(
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

        return ResponseEntity.ok(practiceAssessmentRepository.findByPlayerId(playerId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<com.cpi.cpi_backend.entity.PracticeSession>> getSessions(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN) {
            return ResponseEntity.ok(practiceSessionRepository.findByOrganizationId(managedCoach.getOrganization().getId()));
        } else {
            return ResponseEntity.ok(practiceSessionRepository.findByCoachId(managedCoach.getId()));
        }
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<com.cpi.cpi_backend.dto.PracticeSessionDetailsResponse> getSessionDetails(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        com.cpi.cpi_backend.entity.PracticeSession session = practiceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Practice session not found"));

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() != com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (!session.getTeam().getCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized");
            }
        }

        List<PracticeAssessment> assessments = practiceAssessmentRepository.findBySessionId(sessionId);

        return ResponseEntity.ok(com.cpi.cpi_backend.dto.PracticeSessionDetailsResponse.builder()
                .session(session)
                .assessments(assessments)
                .build());
    }

    @PostMapping("/sessions")
    @Transactional
    public ResponseEntity<com.cpi.cpi_backend.entity.PracticeSession> createSession(
            @RequestBody com.cpi.cpi_backend.dto.PracticeSessionRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        if (request.getDate() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Session date is required."
            );
        }

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() != com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (!team.getCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized");
            }
        }

        com.cpi.cpi_backend.entity.PracticeSession session = com.cpi.cpi_backend.entity.PracticeSession.builder()
                .team(team)
                .date(request.getDate())
                .playersAssessed(request.getAssessments().size())
                .averagePpi(0.0)
                .build();
        session = practiceSessionRepository.save(session);

        double totalSessionPpi = 0.0;
        int count = 0;

        for (com.cpi.cpi_backend.dto.PracticeSessionRequest.AssessmentDto assDto : request.getAssessments()) {
            Player player = playerRepository.findById(assDto.getPlayerId())
                    .orElseThrow(() -> new RuntimeException("Player not found"));

            // Calculate PPI
            double ppi = (assDto.getTechnique() + assDto.getIntensity() + assDto.getExecution() +
                    assDto.getAdaptability() + assDto.getDiscipline() + assDto.getFocus()) / 6.0;

            PracticeAssessment assessment = PracticeAssessment.builder()
                    .player(player)
                    .session(session)
                    .date(request.getDate())
                    .technique(assDto.getTechnique())
                    .intensity(assDto.getIntensity())
                    .execution(assDto.getExecution())
                    .adaptability(assDto.getAdaptability())
                    .discipline(assDto.getDiscipline())
                    .focus(assDto.getFocus())
                    .ppiScore(ppi)
                    .notes(assDto.getNotes())
                    .build();

            practiceAssessmentRepository.save(assessment);
            totalSessionPpi += ppi;
            count++;

            // Recalculate Player average PPI
            List<PracticeAssessment> playerAssessments = practiceAssessmentRepository.findByPlayerId(player.getId());
            double avgPpi = playerAssessments.stream()
                    .mapToDouble(PracticeAssessment::getPpiScore)
                    .average()
                    .orElse(0.0);
            player.setPpiScore(avgPpi);
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
            session.setAveragePpi(totalSessionPpi / count);
            session = practiceSessionRepository.save(session);
        }

        return ResponseEntity.ok(session);
    }
}
