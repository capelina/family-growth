package com.family.growth.repo;

import com.family.growth.domain.GrowthMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrowthMeasurementRepository extends JpaRepository<GrowthMeasurement, Long> {

    List<GrowthMeasurement> findByMemberIdOrderByDateAsc(Long memberId);
}
