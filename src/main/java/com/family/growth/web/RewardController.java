package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.RewardService;
import com.family.growth.web.dto.RewardDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    /** 商城商品列表 */
    @GetMapping
    public ApiResponse<List<RewardDtos.RewardDto>> list() {
        return ApiResponse.ok(rewardService.list());
    }

    /** 家长上架商品 */
    @PostMapping
    public ApiResponse<RewardDtos.RewardDto> create(@Valid @RequestBody RewardDtos.RewardReq req) {
        return ApiResponse.ok(rewardService.create(req));
    }

    /** 家长修改商品 */
    @PutMapping("/{id}")
    public ApiResponse<RewardDtos.RewardDto> update(@PathVariable Long id,
                                                    @Valid @RequestBody RewardDtos.RewardReq req) {
        return ApiResponse.ok(rewardService.update(id, req));
    }

    /** 家长删除商品 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        rewardService.delete(id);
        return ApiResponse.ok();
    }

    /** 孩子兑换商品 */
    @PostMapping("/{id}/redeem")
    public ApiResponse<RewardDtos.RedemptionDto> redeem(@PathVariable Long id) {
        return ApiResponse.ok(rewardService.redeem(id));
    }

    /** 兑换记录 */
    @GetMapping("/redemptions")
    public ApiResponse<List<RewardDtos.RedemptionDto>> redemptions() {
        return ApiResponse.ok(rewardService.redemptions());
    }

    /** 家长标记已兑现 */
    @PostMapping("/redemptions/{id}/done")
    public ApiResponse<RewardDtos.RedemptionDto> markDone(@PathVariable Long id) {
        return ApiResponse.ok(rewardService.markDone(id));
    }
}
