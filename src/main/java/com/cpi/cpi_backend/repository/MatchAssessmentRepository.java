package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.MatchAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchAssessmentRepository extends JpaRepository<MatchAssessment, Long> {
    List<MatchAssessment> findByPlayerId(Long playerId);

    @Query("SELECT DISTINCT ma FROM MatchAssessment ma JOIN FETCH ma.player p JOIN p.teams t WHERE t.coach.id = :coachId")
    List<MatchAssessment> findByCoachId(@Param("coachId") Long coachId);

    @Query("SELECT DISTINCT ma FROM MatchAssessment ma JOIN FETCH ma.player p JOIN p.teams t WHERE t.coach.id = :coachId ORDER BY ma.createdAt DESC")
    List<MatchAssessment> findTop10ByCoachIdOrderByCreatedAtDesc(@Param("coachId") Long coachId);

    @Query("SELECT ma FROM MatchAssessment ma JOIN FETCH ma.player p WHERE p.organization.id = :orgId")
    List<MatchAssessment> findByOrganizationId(@Param("orgId") Long orgId);

    @Query("SELECT ma FROM MatchAssessment ma JOIN FETCH ma.player p WHERE p.organization.id = :orgId ORDER BY ma.createdAt DESC")
    List<MatchAssessment> findTop10ByOrganizationIdOrderByCreatedAtDesc(@Param("orgId") Long orgId);
}
