package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * 积分商城 DTO。
 */
public final class RewardDtos {

    private RewardDtos() {
    }

    public record RewardDto(
            Long id,
            String name,
            String description,
            String image,
            Integer costPoints,
            String status,
            LocalDateTime createdAt) {
    }

    public record RewardReq(
            @NotBlank(message = "商品名称不能为空") String name,
            String description,
            String image,
            @NotNull(message = "请设置所需积分") Integer costPoints,
            String status) {
    }

    public record RedemptionDto(
            Long id,
            Long rewardId,
            String rewardName,
            Long memberId,
            String memberName,
            String memberAvatar,
            Integer costPoints,
            String status,
            LocalDateTime createdAt) {
    }
}
