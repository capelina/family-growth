package com.family.growth.repo;

import com.family.growth.domain.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Long> {

    List<Reward> findByFamilyIdOrderByCreatedAtDesc(Long familyId);
}
