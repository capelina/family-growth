package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.FamilyService;
import com.family.growth.service.GrowthService;
import com.family.growth.service.RecordService;
import com.family.growth.service.StatsService;
import com.family.growth.service.TaskService;
import com.family.growth.web.dto.DashboardDtos;
import com.family.growth.web.dto.StatsDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final FamilyService familyService;
    private final StatsService statsService;
    private final RecordService recordService;
    private final TaskService taskService;
    private final GrowthService growthService;

    /** 记录展示与可视化分析 */
    @GetMapping("/stats")
    public ApiResponse<StatsDtos.StatsResp> stats(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(statsService.stats(days));
    }

    /** 首页聚合数据 */
    @GetMapping("/dashboard")
    public ApiResponse<DashboardDtos.DashboardDto> dashboard() {
        Long familyId = familyService.currentFamilyId();
        Long userId = familyService.requireUser().getId();
        StatsDtos.StatsResp stats = statsService.stats(30);
        return ApiResponse.ok(new DashboardDtos.DashboardDto(
                familyService.familyDto(familyId),
                stats.overview(),
                recordService.page(familyId, userId, null, null, null, null, null, 0, 6).items(),
                taskService.list(null, null),
                taskService.pendingSubmissions(),
                recordService.pendingReviews(familyId, userId),
                growthService.recentMilestones(familyId, 5),
                stats.trend(),
                stats.categories(),
                stats.members()));
    }
}
