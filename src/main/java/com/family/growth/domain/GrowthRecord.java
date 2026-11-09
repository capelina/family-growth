package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 亲子记录（核心）：自由记录 + 任务记录。
 */
@Entity
@Table(name = "fg_record")
@Getter
@Setter
@NoArgsConstructor
public class GrowthRecord {

    public static final String TYPE_FREE = "FREE";
    public static final String TYPE_TASK = "TASK";

    public static final String VISIBILITY_PUBLIC = "PUBLIC";
    public static final String VISIBILITY_PRIVATE = "PRIVATE";

    /** 审核状态：待审核（亲子提交） */
    public static final String STATUS_PENDING = "PENDING";
    /** 审核状态：已通过 */
    public static final String STATUS_APPROVED = "APPROVED";
    /** 审核状态：已退回 */
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long familyId;

    @Column(nullable = false, length = 20)
    private String type = TYPE_FREE;

    /** 来自哪一个任务（任务记录时） */
    private Long taskId;

    /** 记录作者（家长或孩子） */
    private Long authorMemberId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 4000)
    private String content;

    /** 自定义分类标签 */
    @Column(length = 40)
    private String category;

    private LocalDate recordDate;

    @Column(length = 20)
    private String visibility = VISIBILITY_PRIVATE;

    /** 审核状态：亲子提交的记录需家长审核通过后才生效 */
    @Column(length = 20)
    private String status = STATUS_APPROVED;

    @Column(length = 120)
    private String location;

    /** 本次记录获得的积分 */
    private Integer points = 0;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "fg_record_media", joinColumns = @JoinColumn(name = "record_id"))
    @Column(name = "url", length = 400)
    @OrderColumn(name = "sort_no")
    private List<String> mediaUrls = new ArrayList<>();

    /** 标记参与本次记录的成员 */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "fg_record_participant", joinColumns = @JoinColumn(name = "record_id"))
    @Column(name = "member_id")
    private List<Long> participantIds = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
}
