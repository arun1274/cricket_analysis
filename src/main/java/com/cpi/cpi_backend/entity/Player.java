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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Team team;

    private Double ppiScore;
    private Double mpiScore;

    // Maps to the existing organization_id column in the database.
    // Automatically inherited from the team's organizationId during player creation.
    @Column(name = "organization_id")
    private Long organizationId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
