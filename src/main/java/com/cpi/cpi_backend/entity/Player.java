package com.cpi.cpi_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String role; // Batsman, Bowler, All-rounder, Wicketkeeper
    
    private String battingStyle;
    private String bowlingStyle;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "player_teams",
        joinColumns = @JoinColumn(name = "player_id"),
        inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "coach", "organization"})
    @Builder.Default
    private java.util.Set<Team> teams = new java.util.HashSet<>();

    private Double ppiScore;
    private Double mpiScore;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creator_coach_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "password"})
    private Coach creatorCoach;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Transient
    public Team getTeam() {
        if (teams == null || teams.isEmpty()) {
            return null;
        }
        return teams.stream()
                .min(java.util.Comparator.comparing(Team::getId))
                .orElse(null);
    }

    public void setTeam(Team team) {
        if (this.teams == null) {
            this.teams = new java.util.HashSet<>();
        }
        this.teams.clear();
        if (team != null) {
            this.teams.add(team);
        }
    }
}
