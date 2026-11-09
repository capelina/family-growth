package com.family.growth.repo;

import com.family.growth.domain.PlazaLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlazaLikeRepository extends JpaRepository<PlazaLike, Long> {

    Optional<PlazaLike> findByRecordIdAndUserId(Long recordId, Long userId);

    long countByRecordId(Long recordId);

    List<PlazaLike> findByUserIdAndRecordIdIn(Long userId, List<Long> recordIds);
}
