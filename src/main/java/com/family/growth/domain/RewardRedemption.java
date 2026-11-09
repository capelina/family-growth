package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 积分兑换记录：孩子用积分兑换商城商品。
 */
@Entity
@Table(name = "fg_reward_redemption")
@Getter
@Setter
@NoArgsConstructor
public class RewardRedemption {

    /** 已兑换，待家长兑现 */
    public static final String STATUS_REDEEMED = "REDEEMED";
    /** 家长已兑现奖励 */
    public static final String STATUS_DONE = "DONE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long familyId;

    @Column(nullable = false)
    private Long rewardId;

    @Column(nullable = false)
    private Long memberId;

    /** 兑换时消耗的积分（快照） */
    @Column(nullable = false)
    private Integer costPoints;

    /** 商品名称快照（商品被删除/改名后仍可追溯） */
    @Column(nullable = false, length = 80)
    private String rewardName;

    @Column(nullable = false, length = 12)
    private String status = STATUS_REDEEMED;

    private LocalDateTime createdAt = LocalDateTime.now();
}
