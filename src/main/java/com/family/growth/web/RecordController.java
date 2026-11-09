package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.RecordService;
import com.family.growth.web.dto.RecordDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    /** 时间线（家庭内数据，支持筛选） */
    @GetMapping
    public ApiResponse<RecordDtos.PageResp<RecordDtos.RecordDto>> page(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Long familyId = recordService.familyId();
        return ApiResponse.ok(recordService.page(familyId, recordService.currentUserId(),
                type, category, memberId, month, keyword, page, size));
    }

    /** 记录详情 */
    @GetMapping("/{id}")
    public ApiResponse<RecordDtos.RecordDto> detail(@PathVariable Long id) {
        return ApiResponse.ok(recordService.detail(id));
    }

    /** 新增记录（自由记录 / 任务记录） */
    @PostMapping
    public ApiResponse<RecordDtos.RecordDto> create(@Valid @RequestBody RecordDtos.RecordReq req) {
        return ApiResponse.ok(recordService.create(req));
    }

    /** 修改记录 */
    @PutMapping("/{id}")
    public ApiResponse<RecordDtos.RecordDto> update(@PathVariable Long id,
                                                    @Valid @RequestBody RecordDtos.RecordReq req) {
        return ApiResponse.ok(recordService.update(id, req));
    }

    /** 删除记录 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        recordService.delete(id);
        return ApiResponse.ok();
    }

    /** 家长审核亲子提交的记录 */
    @PostMapping("/{id}/review")
    public ApiResponse<RecordDtos.RecordDto> review(@PathVariable Long id,
                                                    @RequestBody RecordDtos.RecordReviewReq req) {
        return ApiResponse.ok(recordService.review(id, req));
    }

    /** 分类标签统计 */
    @GetMapping("/categories")
    public ApiResponse<List<RecordDtos.CategoryStat>> categories() {
        return ApiResponse.ok(recordService.categories());
    }

    /** 照片墙 */
    @GetMapping("/photo-wall")
    public ApiResponse<List<RecordDtos.RecordDto>> photoWall(@RequestParam(defaultValue = "24") int limit) {
        return ApiResponse.ok(recordService.photoWall(recordService.familyId(), recordService.currentUserId(), limit));
    }
}
