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
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Coach coach;

    private Double teamCpiScore;

    // Maps to the existing organization_id NOT NULL column in the database.
    // Automatically inherited from the coach who creates the team.
    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
