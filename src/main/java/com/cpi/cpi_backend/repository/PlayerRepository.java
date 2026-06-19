package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    @Query("SELECT DISTINCT p FROM Player p LEFT JOIN FETCH p.teams t WHERE t.id = :teamId")
    List<Player> findByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT DISTINCT p FROM Player p LEFT JOIN FETCH p.teams t WHERE t.coach.id = :coachId")
    List<Player> findByTeamCoachId(@Param("coachId") Long coachId);

    @Query("SELECT DISTINCT p FROM Player p LEFT JOIN FETCH p.teams t WHERE p.organization.id = :organizationId")
    List<Player> findByOrganizationId(@Param("organizationId") Long organizationId);

    @Query("SELECT DISTINCT p FROM Player p LEFT JOIN FETCH p.teams t WHERE p.creatorCoach.id = :coachId")
    List<Player> findByCreatorCoachId(@Param("coachId") Long coachId);
}
