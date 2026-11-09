package com.family.growth.repo;

import com.family.growth.domain.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findByToken(String token);

    void deleteByUserId(Long userId);
}
