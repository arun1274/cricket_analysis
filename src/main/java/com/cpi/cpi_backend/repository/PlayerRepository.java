package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    @Query("SELECT p FROM Player p JOIN FETCH p.team t WHERE t.id = :teamId")
    List<Player> findByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT p FROM Player p JOIN FETCH p.team t WHERE t.coach.id = :coachId")
    List<Player> findByTeamCoachId(@Param("coachId") Long coachId);
}
