package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 家庭积分商城中的商品（奖励），由家长维护。
 */
@Entity
@Table(name = "fg_reward")
@Getter
@Setter
@NoArgsConstructor
public class Reward {

    public static final String STATUS_ON = "ON";
    public static final String STATUS_OFF = "OFF";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long familyId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 400)
    private String image;

    /** 兑换所需积分 */
    @Column(nullable = false)
    private Integer costPoints = 10;

    /** 上架状态：ON 可兑换；OFF 下架 */
    @Column(nullable = false, length = 10)
    private String status = STATUS_ON;

    private LocalDateTime createdAt = LocalDateTime.now();
}
