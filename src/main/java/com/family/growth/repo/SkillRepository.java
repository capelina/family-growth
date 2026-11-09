package com.family.growth.repo;

import com.family.growth.domain.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    List<Skill> findByMemberIdOrderByCategoryAscLevelDesc(Long memberId);
}
