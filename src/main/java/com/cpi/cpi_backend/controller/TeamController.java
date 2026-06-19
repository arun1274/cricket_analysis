package com.cpi.cpi_backend.controller;

import com.cpi.cpi_backend.dto.TeamRequest;
import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.Team;
import com.cpi.cpi_backend.entity.Player;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.TeamRepository;
import com.cpi.cpi_backend.repository.PlayerRepository;
import com.cpi.cpi_backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;
    private final OrganizationRepository organizationRepository;

    private void checkAccess(Team team, Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (team.getOrganization() == null || managedCoach.getOrganization() == null ||
                !team.getOrganization().getId().equals(managedCoach.getOrganization().getId())) {
                throw new RuntimeException("Unauthorized: Team belongs to a different organization");
            }
        } else {
            if (!team.getCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized: You do not manage this team");
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<Team>> getMyTeams(@AuthenticationPrincipal Coach currentCoach) {
        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        if (managedCoach.getOrganization() == null) {
            return ResponseEntity.ok(List.of());
        }

        if (managedCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN) {
            return ResponseEntity.ok(teamRepository.findByOrganizationId(managedCoach.getOrganization().getId()));
        } else {
            return ResponseEntity.ok(teamRepository.findByCoachId(managedCoach.getId()));
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Team> createTeam(
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Coach creatorCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        com.cpi.cpi_backend.entity.Organization org = creatorCoach.getOrganization();
        if (org == null || !organizationRepository.existsById(org.getId())) {
            throw new RuntimeException("Please create or join an organization before creating teams.");
        }

        Coach assignedCoach = creatorCoach;
        if (creatorCoach.getRole() == com.cpi.cpi_backend.entity.Role.ADMIN && request.getCoachId() != null) {
            assignedCoach = coachRepository.findById(request.getCoachId())
                    .orElseThrow(() -> new RuntimeException("Target coach not found"));
            if (assignedCoach.getOrganization() == null || !assignedCoach.getOrganization().getId().equals(org.getId())) {
                throw new RuntimeException("Target coach does not belong to your organization");
            }
        }

        Team team = Team.builder()
                .name(request.getName())
                .level(request.getLevel())
                .coach(assignedCoach)
                .teamCpiScore(0.0)
                .organization(org)
                .build();
        return ResponseEntity.ok(teamRepository.save(team));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Team> updateTeam(
            @PathVariable Long id,
            @RequestBody TeamRequest request,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        checkAccess(team, currentCoach);

        team.setName(request.getName());
        team.setLevel(request.getLevel());

        return ResponseEntity.ok(teamRepository.save(team));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        checkAccess(team, currentCoach);

        // Decouple players of the team instead of deleting completely
        List<Player> players = playerRepository.findByTeamId(id);
        for (Player player : players) {
            player.getTeams().remove(team);
            playerRepository.save(player);
        }

        teamRepository.delete(team);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{teamId}/players/{playerId}")
    @Transactional
    public ResponseEntity<Void> addPlayerToTeam(
            @PathVariable Long teamId,
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(team, currentCoach);

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        if (managedCoach.getRole() != com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (player.getCreatorCoach() == null || !player.getCreatorCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this player");
            }
        }

        if (team.getOrganization() == null || player.getOrganization() == null ||
            !team.getOrganization().getId().equals(player.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized: Team and player must be in the same organization");
        }

        player.getTeams().add(team);
        playerRepository.save(player);

        // Recalculate Team average CPI score
        List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
        double teamCpi = teamPlayers.stream()
                .mapToDouble(p -> ((p.getPpiScore() != null ? p.getPpiScore() : 0.0) + (p.getMpiScore() != null ? p.getMpiScore() : 0.0)) / 2.0)
                .average()
                .orElse(0.0);
        team.setTeamCpiScore(teamCpi);
        teamRepository.save(team);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{teamId}/players/{playerId}")
    @Transactional
    public ResponseEntity<Void> removePlayerFromTeam(
            @PathVariable Long teamId,
            @PathVariable Long playerId,
            @AuthenticationPrincipal Coach currentCoach
    ) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        checkAccess(team, currentCoach);

        Coach managedCoach = coachRepository.findById(currentCoach.getId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        if (managedCoach.getRole() != com.cpi.cpi_backend.entity.Role.ADMIN) {
            if (player.getCreatorCoach() == null || !player.getCreatorCoach().getId().equals(managedCoach.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this player");
            }
        }

        player.getTeams().remove(team);
        playerRepository.save(player);

        // Recalculate Team average CPI score
        List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
        double teamCpi = teamPlayers.stream()
                .mapToDouble(p -> ((p.getPpiScore() != null ? p.getPpiScore() : 0.0) + (p.getMpiScore() != null ? p.getMpiScore() : 0.0)) / 2.0)
                .average()
                .orElse(0.0);
        team.setTeamCpiScore(teamCpi);
        teamRepository.save(team);

        return ResponseEntity.noContent().build();
    }
}
