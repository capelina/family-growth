package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 家长发布的任务。
 */
@Entity
@Table(name = "fg_task")
@Getter
@Setter
@NoArgsConstructor
public class Task {

    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_CLOSED = "CLOSED";

    /** 截止模式：到达截止时间前完成 */
    public static final String MODE_DEADLINE = "DEADLINE";
    /** 限时模式：孩子点击「开始」后倒计时，限定时间内完成 */
    public static final String MODE_DURATION = "DURATION";

    /** 提交方式：看板提交凭证（默认） */
    public static final String SUBMIT_PROOF = "PROOF";
    /** 提交方式：提交亲子记录完成任务 */
    public static final String SUBMIT_RECORD = "RECORD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long familyId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 2000)
    private String description;

    /** 任务模式：DEADLINE=按截止时间；DURATION=限定时长 */
    @Column(length = 20)
    private String taskMode = MODE_DEADLINE;

    /** 截止时间（精确到分钟，DEADLINE 模式使用） */
    private LocalDateTime deadline;

    /** 限定时长（分钟，DURATION 模式使用） */
    private Integer durationMinutes;

    /** 提交时是否必须上传任务期间的照片 / 视频凭证 */
    private Boolean requireProof = false;

    /** 提交方式：PROOF=看板提交凭证；RECORD=提交亲子记录 */
    @Column(length = 20)
    private String submitMode = SUBMIT_PROOF;

    /** 完成可获得积分 */
    private Integer points = 10;

    /** 指定执行的孩子 */
    private Long assigneeMemberId;

    @Column(length = 40)
    private String category;

    @Column(nullable = false, length = 20)
    private String status = STATUS_OPEN;

    private Long createdByMemberId;

    /** 点击「开始」的孩子（DURATION 模式） */
    private Long startedByMemberId;

    /** 开始计时时间（DURATION 模式） */
    private LocalDateTime startedAt;

    /** 计时到期时间（DURATION 模式） */
    private LocalDateTime expiresAt;

    private LocalDateTime createdAt = LocalDateTime.now();
}
