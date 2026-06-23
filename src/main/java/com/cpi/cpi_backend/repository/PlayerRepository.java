package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByCreatorCoachId(Long coachId);
    java.util.Optional<Player> findByInvitationCode(String invitationCode);
}
