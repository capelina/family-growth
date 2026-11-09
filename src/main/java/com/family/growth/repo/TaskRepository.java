package com.family.growth.repo;

import com.family.growth.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByFamilyIdOrderByCreatedAtDesc(Long familyId);

    List<Task> findByFamilyIdAndStatusOrderByDeadlineAsc(Long familyId, String status);

    long countByFamilyId(Long familyId);

    void deleteByFamilyId(Long familyId);
}
