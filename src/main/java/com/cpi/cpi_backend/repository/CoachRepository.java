package com.cpi.cpi_backend.repository;

import com.cpi.cpi_backend.entity.Coach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoachRepository extends JpaRepository<Coach, Long> {
    Optional<Coach> findByEmail(String email);
    java.util.List<Coach> findByOrganizationId(Long organizationId);
}
