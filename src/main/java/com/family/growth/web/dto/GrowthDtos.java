package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

/**
 * 成长档案 DTO。
 */
public final class GrowthDtos {

    private GrowthDtos() {
    }

    public record MeasurementDto(
            Long id,
            Long memberId,
            LocalDate date,
            Double heightCm,
            Double weightKg,
            String note) {
    }

    public record MeasurementReq(LocalDate date, Double heightCm, Double weightKg, String note) {
    }

    public record MilestoneDto(
            Long id,
            Long memberId,
            String title,
            LocalDate date,
            String description,
            String icon,
            String cover,
            Boolean achieved) {
    }

    public record MilestoneReq(
            @NotBlank(message = "里程碑名称不能为空") String title,
            LocalDate date,
            String description,
            String icon,
            String cover) {
    }

    public record SkillDto(
            Long id,
            Long memberId,
            String name,
            String category,
            Integer level,
            String note) {
    }

    public record SkillReq(
            @NotBlank(message = "技能名称不能为空") String name,
            String category,
            Integer level,
            String note) {
    }

    public record GrowthProfileDto(
            FamilyDtos.MemberDto member,
            List<MeasurementDto> measurements,
            List<MilestoneDto> milestones,
            List<SkillDto> skills,
            Integer ageMonths,
            int recordCount,
            int taskDoneCount,
            int photoCount,
            String latestHeight,
            String latestWeight) {
    }
}
