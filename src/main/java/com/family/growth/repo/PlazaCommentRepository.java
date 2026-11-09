package com.family.growth.repo;

import com.family.growth.domain.PlazaComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlazaCommentRepository extends JpaRepository<PlazaComment, Long> {

    List<PlazaComment> findByRecordIdOrderByCreatedAtAsc(Long recordId);

    long countByRecordId(Long recordId);

    void deleteByRecordId(Long recordId);
}
