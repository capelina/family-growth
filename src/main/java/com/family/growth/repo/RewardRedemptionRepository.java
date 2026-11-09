package com.family.growth.repo;

import com.family.growth.domain.RewardRedemption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RewardRedemptionRepository extends JpaRepository<RewardRedemption, Long> {

    List<RewardRedemption> findByFamilyIdOrderByCreatedAtDesc(Long familyId);
}
