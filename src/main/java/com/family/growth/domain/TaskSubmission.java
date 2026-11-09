package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 孩子提交的任务凭证，等待家长审核。
 */
@Entity
@Table(name = "fg_task_submission")
@Getter
@Setter
@NoArgsConstructor
public class TaskSubmission {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long taskId;

    @Column(nullable = false)
    private Long memberId;

    @Column(length = 2000)
    private String note;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "fg_submission_media", joinColumns = @JoinColumn(name = "submission_id"))
    @Column(name = "url", length = 400)
    @OrderColumn(name = "sort_no")
    private List<String> mediaUrls = new ArrayList<>();

    @Column(nullable = false, length = 20)
    private String status = STATUS_PENDING;

    @Column(length = 500)
    private String reviewComment;

    private LocalDateTime submittedAt = LocalDateTime.now();

    private LocalDateTime reviewedAt;
}
