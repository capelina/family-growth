package com.family.growth.web.dto;

import java.util.List;

/**
 * 统计与可视化 DTO。
 */
public final class StatsDtos {

    private StatsDtos() {
    }

    public record OverviewDto(
            long monthRecords,
            long weekRecords,
            long doneTasks,
            long pendingTasks,
            int totalPoints,
            int memberCount,
            long publicRecords,
            long totalRecords,
            int streakDays) {
    }

    public record TrendPoint(String date, long count) {
    }

    public record MemberStat(
            Long memberId,
            String name,
            String avatar,
            String color,
            String role,
            String relation,
            long records,
            int points,
            int rank) {
    }

    public record CategoryStat(String name, long count) {
    }

    public record StatsResp(
            OverviewDto overview,
            List<TrendPoint> trend,
            List<MemberStat> members,
            List<CategoryStat> categories) {
    }
}
