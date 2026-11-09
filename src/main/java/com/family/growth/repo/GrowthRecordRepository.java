package com.family.growth.repo;

import com.family.growth.domain.GrowthRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface GrowthRecordRepository extends JpaRepository<GrowthRecord, Long>, JpaSpecificationExecutor<GrowthRecord> {

    Page<GrowthRecord> findByFamilyId(Long familyId, Pageable pageable);

    Page<GrowthRecord> findByVisibility(String visibility, Pageable pageable);

    List<GrowthRecord> findByTaskId(Long taskId);

    long countByFamilyId(Long familyId);

    void deleteByFamilyId(Long familyId);
}
