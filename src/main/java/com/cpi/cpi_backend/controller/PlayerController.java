package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.PlayerRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.CoachRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;

    private void checkAccess(Player player, Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() == Role.ADMIN) {
            return;
        } else {
            boolean isCreator = player.getCreatorCoach() != null && player.getCreatorCoach().getId().equals(managedCoach.getId());
            boolean isSelf = player.getName() != null && player.getName().equalsIgnoreCase(managedCoach.getName());
            
            if (!isCreator && !isSelf) {
                throw new RuntimeException("Unauthorized");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<Player>> getMyPlayers(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(playerRepository.findAll());
        }

        List<Player> allPlayers = new ArrayList<>(playerRepository.findByCreatorCoachId(managedCoach.getId()));
        
        // Also check if there's a player record with their name
        boolean hasSelf = allPlayers.stream().anyMatch(p -> p.getName() != null && p.getName().equalsIgnoreCase(managedCoach.getName()));
        if (!hasSelf) {
            playerRepository.findAll().stream()
                    .filter(p -> p.getName() != null && p.getName().equalsIgnoreCase(managedCoach.getName()))
                    .findFirst()
                    .ifPresent(allPlayers::add);
        }

        return ResponseEntity.ok(allPlayers);
    }

    private String generateInvitationCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        java.util.Random rnd = new java.util.Random();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return "CPI-" + sb.toString();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Player> createPlayer(
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach creatorCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        String code;
        do {
            code = generateInvitationCode();
        } while (playerRepository.findByInvitationCode(code).isPresent());

        Player player = Player.builder()
                .name(request.getName())
                .role(request.getRole())
                .battingStyle(request.getBattingStyle())
                .bowlingStyle(request.getBowlingStyle())
                .creatorCoach(creatorCoach)
                .ppiScore(0.0)
                .mpiScore(0.0)
                .invitationCode(code)
                .invitationCodeActivated(false)
                .build();
                
        return ResponseEntity.ok(playerRepository.save(player));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Player> updatePlayer(
            @PathVariable Long id,
            @RequestBody PlayerRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(player, currentCoach);

        player.setName(request.getName());
        player.setRole(request.getRole());
        player.setBattingStyle(request.getBattingStyle());
        player.setBowlingStyle(request.getBowlingStyle());

        return ResponseEntity.ok(playerRepository.save(player));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletePlayer(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(player, currentCoach);

        playerRepository.delete(player);
        return ResponseEntity.noContent().build();
    }
}
