package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.PlazaService;
import com.family.growth.web.dto.PlazaDtos;
import com.family.growth.web.dto.RecordDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plaza")
@RequiredArgsConstructor
public class PlazaController {

    private final PlazaService plazaService;

    /** 广场动态（所有家庭的公开记录） */
    @GetMapping("/feed")
    public ApiResponse<RecordDtos.PageResp<PlazaDtos.FeedItemDto>> feed(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(plazaService.feed(category, page, size));
    }

    /** 广场热门分类 */
    @GetMapping("/categories")
    public ApiResponse<List<RecordDtos.CategoryStat>> categories() {
        return ApiResponse.ok(plazaService.categories());
    }

    /** 点赞 / 取消点赞 */
    @PostMapping("/{recordId}/like")
    public ApiResponse<PlazaDtos.LikeResp> like(@PathVariable Long recordId) {
        return ApiResponse.ok(plazaService.toggleLike(recordId));
    }

    /** 评论列表 */
    @GetMapping("/{recordId}/comments")
    public ApiResponse<List<PlazaDtos.CommentDto>> comments(@PathVariable Long recordId) {
        return ApiResponse.ok(plazaService.comments(recordId));
    }

    /** 发表评论 */
    @PostMapping("/{recordId}/comments")
    public ApiResponse<List<PlazaDtos.CommentDto>> addComment(@PathVariable Long recordId,
                                                              @Valid @RequestBody PlazaDtos.CommentReq req) {
        return ApiResponse.ok(plazaService.addComment(recordId, req.content()));
    }
}
