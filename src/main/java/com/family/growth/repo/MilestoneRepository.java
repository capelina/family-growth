package com.family.growth.repo;

import com.family.growth.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByMemberIdOrderByDateDesc(Long memberId);
}
