package com.cpi.cpi_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type; // Academy / School / Club / Professional Team
    private String sport;
    private String country;
    private String city;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logoUrl;

    @Column(name = "join_code", nullable = false)
    private String joinCode;
}
