package com.family.growth.repo;

import com.family.growth.domain.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    List<FamilyMember> findByFamilyIdOrderByIdAsc(Long familyId);

    List<FamilyMember> findByFamilyIdAndRoleOrderByIdAsc(Long familyId, String role);

    Optional<FamilyMember> findByFamilyIdAndUserId(Long familyId, Long userId);

    Optional<FamilyMember> findByFamilyIdAndUserIdAndRole(Long familyId, Long userId, String role);

    List<FamilyMember> findByIdIn(List<Long> ids);

    void deleteByFamilyId(Long familyId);
}
