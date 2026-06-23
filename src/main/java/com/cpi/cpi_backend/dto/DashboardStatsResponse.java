package com.cpi.cpi_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {
    private long totalTeams;
    private long totalPlayers;
    private long totalPracticeSessions;
    private long totalMatches;
    private double avgPpi;
    private double avgMpi;
    private double avgCpi;

    // Redesigned dashboard metrics
    private long playersAssessedToday;
    private long practicesToday;
    private long matchesToday;

    private List<RecentAssessmentDto> recentAssessments;
    private List<PlayerPerformanceDto> playersNeedingAttention;
    private List<PlayerPerformanceDto> topPerformers;
    private List<String> coachInsights;

    private List<TeamPerformanceDto> teamPerformance;
    private List<TrendDto> cpiTrend;
    private List<TrendDto> practiceTrend;
    private List<TrendDto> matchTrend;
    private List<ActivityDto> activityFeed;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TeamPerformanceDto {
        private String teamName;
        private double cpi;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TrendDto {
        private String label; // e.g., "Week 1", "June 19"
        private double value;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActivityDto {
        private String type;
        private String title;
        private String description;
        private LocalDateTime timestamp;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecentAssessmentDto {
        private String playerName;
        private String assessmentType; // PRACTICE or MATCH
        private double score;
        private LocalDateTime date;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PlayerPerformanceDto {
        private String name;
        private double cpi;
        private String role;
    }
}
