package com.family.growth.repo;

import com.family.growth.domain.TaskSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, Long> {

    List<TaskSubmission> findByTaskIdOrderBySubmittedAtDesc(Long taskId);

    List<TaskSubmission> findByTaskIdIn(List<Long> taskIds);

    List<TaskSubmission> findByMemberIdOrderBySubmittedAtDesc(Long memberId);

    long countByStatus(String status);

    void deleteByTaskId(Long taskId);
}
