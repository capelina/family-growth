package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.GrowthService;
import com.family.growth.web.dto.GrowthDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/growth")
@RequiredArgsConstructor
public class GrowthController {

    private final GrowthService growthService;

    /** 成长档案总览 */
    @GetMapping("/{memberId}")
    public ApiResponse<GrowthDtos.GrowthProfileDto> profile(@PathVariable Long memberId) {
        return ApiResponse.ok(growthService.profile(memberId));
    }

    /** 新增身高体重测量 */
    @PostMapping("/{memberId}/measurements")
    public ApiResponse<GrowthDtos.MeasurementDto> addMeasurement(@PathVariable Long memberId,
                                                                 @RequestBody GrowthDtos.MeasurementReq req) {
        return ApiResponse.ok(growthService.addMeasurement(memberId, req));
    }

    @DeleteMapping("/measurements/{id}")
    public ApiResponse<Void> deleteMeasurement(@PathVariable Long id) {
        growthService.deleteMeasurement(id);
        return ApiResponse.ok();
    }

    /** 新增成长里程碑 */
    @PostMapping("/{memberId}/milestones")
    public ApiResponse<GrowthDtos.MilestoneDto> addMilestone(@PathVariable Long memberId,
                                                             @Valid @RequestBody GrowthDtos.MilestoneReq req) {
        return ApiResponse.ok(growthService.addMilestone(memberId, req));
    }

    @DeleteMapping("/milestones/{id}")
    public ApiResponse<Void> deleteMilestone(@PathVariable Long id) {
        growthService.deleteMilestone(id);
        return ApiResponse.ok();
    }

    /** 新增技能 */
    @PostMapping("/{memberId}/skills")
    public ApiResponse<GrowthDtos.SkillDto> addSkill(@PathVariable Long memberId,
                                                     @Valid @RequestBody GrowthDtos.SkillReq req) {
        return ApiResponse.ok(growthService.addSkill(memberId, req));
    }

    /** 更新技能掌握程度 */
    @PutMapping("/skills/{id}")
    public ApiResponse<GrowthDtos.SkillDto> updateSkill(@PathVariable Long id,
                                                        @RequestBody GrowthDtos.SkillReq req) {
        return ApiResponse.ok(growthService.updateSkill(id, req));
    }

    @DeleteMapping("/skills/{id}")
    public ApiResponse<Void> deleteSkill(@PathVariable Long id) {
        growthService.deleteSkill(id);
        return ApiResponse.ok();
    }
}
