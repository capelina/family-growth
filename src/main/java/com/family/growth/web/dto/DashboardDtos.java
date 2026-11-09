package com.family.growth.web.dto;

import java.util.List;

/**
 * 首页概览聚合数据。
 */
public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record DashboardDto(
            FamilyDtos.FamilyDto family,
            StatsDtos.OverviewDto overview,
            List<RecordDtos.RecordDto> recentRecords,
            List<TaskDtos.TaskDto> tasks,
            List<TaskDtos.SubmissionDto> pendingSubmissions,
            List<RecordDtos.RecordDto> pendingRecords,
            List<GrowthDtos.MilestoneDto> recentMilestones,
            List<StatsDtos.TrendPoint> trend,
            List<StatsDtos.CategoryStat> categories,
            List<StatsDtos.MemberStat> memberStats) {
    }
}
