package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.PracticeAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeAssessmentRepository extends JpaRepository<PracticeAssessment, Long> {
    List<PracticeAssessment> findByPlayerId(Long playerId);

    @Query("SELECT DISTINCT pa FROM PracticeAssessment pa JOIN FETCH pa.player p JOIN p.teams t WHERE t.coach.id = :coachId")
    List<PracticeAssessment> findByCoachId(@Param("coachId") Long coachId);

    @Query("SELECT DISTINCT pa FROM PracticeAssessment pa JOIN FETCH pa.player p JOIN p.teams t WHERE t.coach.id = :coachId ORDER BY pa.createdAt DESC")
    List<PracticeAssessment> findTop10ByCoachIdOrderByCreatedAtDesc(@Param("coachId") Long coachId);

    @Query("SELECT pa FROM PracticeAssessment pa JOIN FETCH pa.player p WHERE p.organization.id = :orgId")
    List<PracticeAssessment> findByOrganizationId(@Param("orgId") Long orgId);

    @Query("SELECT pa FROM PracticeAssessment pa JOIN FETCH pa.player p WHERE p.organization.id = :orgId ORDER BY pa.createdAt DESC")
    List<PracticeAssessment> findTop10ByOrganizationIdOrderByCreatedAtDesc(@Param("orgId") Long orgId);
}
