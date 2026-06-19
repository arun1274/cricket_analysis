package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.DashboardStatsResponse;
import com.cpi.cpi_backend.entity.*;
import com.cpi.cpi_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final PracticeAssessmentRepository practiceAssessmentRepository;
    private final MatchAssessmentRepository matchAssessmentRepository;
    private final CoachRepository coachRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Long coachId = currentCoach.getId();
        Coach managedCoach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        List<Team> teams;
        List<Player> players;
        List<PracticeAssessment> practiceAssessments;
        List<MatchAssessment> matchAssessments;

        if (managedCoach.getRole() == Role.ADMIN) {
            Long orgId = managedCoach.getOrganization() != null ? managedCoach.getOrganization().getId() : null;
            if (orgId != null) {
                teams = teamRepository.findByOrganizationId(orgId);
                players = playerRepository.findByOrganizationId(orgId);
                practiceAssessments = practiceAssessmentRepository.findByOrganizationId(orgId);
                matchAssessments = matchAssessmentRepository.findByOrganizationId(orgId);
            } else {
                teams = List.of();
                players = List.of();
                practiceAssessments = List.of();
                matchAssessments = List.of();
            }
        } else {
            teams = teamRepository.findByCoachId(coachId);
            players = playerRepository.findByCreatorCoachId(coachId);
            practiceAssessments = practiceAssessmentRepository.findByCoachId(coachId);
            matchAssessments = matchAssessmentRepository.findByCoachId(coachId);
        }

        // 2. Compute Card Stats
        long totalTeams = teams.size();
        long totalPlayers = players.size();
        long totalPracticeSessions = practiceAssessments.size();
        long totalMatches = matchAssessments.size();

        double avgPpi = players.stream()
                .filter(p -> p.getPpiScore() != null && p.getPpiScore() > 0)
                .mapToDouble(Player::getPpiScore)
                .average()
                .orElse(0.0);

        double avgMpi = players.stream()
                .filter(p -> p.getMpiScore() != null && p.getMpiScore() > 0)
                .mapToDouble(Player::getMpiScore)
                .average()
                .orElse(0.0);

        double avgCpi = players.stream()
                .filter(p -> p.getPpiScore() != null || p.getMpiScore() != null)
                .mapToDouble(p -> {
                    double ppi = p.getPpiScore() != null ? p.getPpiScore() : 0.0;
                    double mpi = p.getMpiScore() != null ? p.getMpiScore() : 0.0;
                    if (ppi > 0 && mpi > 0) return (ppi + mpi) / 2.0;
                    return ppi > 0 ? ppi : mpi;
                })
                .average()
                .orElse(0.0);

        // 3. Team Performance Chart Data
        List<DashboardStatsResponse.TeamPerformanceDto> teamPerformance = teams.stream()
                .map(t -> DashboardStatsResponse.TeamPerformanceDto.builder()
                        .teamName(t.getName())
                        .cpi(t.getTeamCpiScore() != null ? t.getTeamCpiScore() : 0.0)
                        .build())
                .collect(Collectors.toList());

        // 4. Trend Chart Data (Format: Jun 19)
        DateTimeFormatter df = DateTimeFormatter.ofPattern("MMM dd");

        List<DashboardStatsResponse.TrendDto> practiceTrend = practiceAssessments.stream()
                .sorted(Comparator.comparing(PracticeAssessment::getDate))
                .map(pa -> DashboardStatsResponse.TrendDto.builder()
                        .label(pa.getDate().format(df))
                        .value(pa.getPpiScore())
                        .build())
                .collect(Collectors.toList());

        List<DashboardStatsResponse.TrendDto> matchTrend = matchAssessments.stream()
                .sorted(Comparator.comparing(MatchAssessment::getDate))
                .map(ma -> DashboardStatsResponse.TrendDto.builder()
                        .label(ma.getDate().format(df))
                        .value(ma.getMpiScore())
                        .build())
                .collect(Collectors.toList());

        // Combine trends for CPI Trend
        List<DashboardStatsResponse.TrendDto> cpiTrend = new ArrayList<>();
        int trendSize = Math.max(practiceTrend.size(), matchTrend.size());
        for (int i = 0; i < trendSize; i++) {
            String label = "";
            double val = 0.0;
            if (i < practiceTrend.size() && i < matchTrend.size()) {
                label = practiceTrend.get(i).getLabel();
                val = (practiceTrend.get(i).getValue() + matchTrend.get(i).getValue()) / 2.0;
            } else if (i < practiceTrend.size()) {
                label = practiceTrend.get(i).getLabel();
                val = practiceTrend.get(i).getValue();
            } else {
                label = matchTrend.get(i).getLabel();
                val = matchTrend.get(i).getValue();
            }
            cpiTrend.add(new DashboardStatsResponse.TrendDto(label, val));
        }

        // 5. Activity Feed
        List<DashboardStatsResponse.ActivityDto> activities = new ArrayList<>();

        for (Team team : teams) {
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("TEAM_CREATED")
                    .title("Team Created")
                    .description("Team '" + team.getName() + "' was successfully created.")
                    .timestamp(team.getCreatedAt())
                    .build());
        }

        for (Player player : players) {
            String teamName = player.getTeam() != null ? player.getTeam().getName() : "Unassigned";
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("PLAYER_ADDED")
                    .title("Player Added")
                    .description("Player '" + player.getName() + "' was added to team '" + teamName + "'.")
                    .timestamp(player.getCreatedAt())
                    .build());
        }

        for (PracticeAssessment pa : practiceAssessments) {
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("PRACTICE_COMPLETED")
                    .title("Practice Completed")
                    .description("Scored " + pa.getPlayer().getName() + " with " + String.format("%.1f", pa.getPpiScore()) + " PPI.")
                    .timestamp(pa.getCreatedAt())
                    .build());
        }

        for (MatchAssessment ma : matchAssessments) {
            activities.add(DashboardStatsResponse.ActivityDto.builder()
                    .type("MATCH_RECORDED")
                    .title("Match Recorded")
                    .description("Scored " + ma.getPlayer().getName() + " with " + String.format("%.1f", ma.getMpiScore()) + " MPI.")
                    .timestamp(ma.getCreatedAt())
                    .build());
        }

        List<DashboardStatsResponse.ActivityDto> sortedActivities = activities.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted(Comparator.comparing(DashboardStatsResponse.ActivityDto::getTimestamp).reversed())
                .limit(10)
                .collect(Collectors.toList());

        DashboardStatsResponse response = DashboardStatsResponse.builder()
                .totalTeams(totalTeams)
                .totalPlayers(totalPlayers)
                .totalPracticeSessions(totalPracticeSessions)
                .totalMatches(totalMatches)
                .avgPpi(avgPpi)
                .avgMpi(avgMpi)
                .avgCpi(avgCpi)
                .teamPerformance(teamPerformance)
                .cpiTrend(cpiTrend)
                .practiceTrend(practiceTrend)
                .matchTrend(matchTrend)
                .activityFeed(sortedActivities)
                .build();

        return ResponseEntity.ok(response);
    }
}
