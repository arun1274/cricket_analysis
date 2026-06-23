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

    private Double ppiScore;
    private Double mpiScore;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creator_coach_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private Coach creatorCoach;

    private String invitationCode;

    @Builder.Default
    private Boolean invitationCodeActivated = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
