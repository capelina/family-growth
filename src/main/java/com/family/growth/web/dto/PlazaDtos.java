package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 互动广场 DTO。
 */
public final class PlazaDtos {

    private PlazaDtos() {
    }

    public record CommentDto(
            Long id,
            Long userId,
            String userName,
            String userAvatar,
            String content,
            LocalDateTime createdAt) {
    }

    public record FeedItemDto(
            Long recordId,
            String title,
            String content,
            String category,
            LocalDate recordDate,
            List<String> mediaUrls,
            Long familyId,
            String familyName,
            String familyCover,
            String authorName,
            String authorAvatar,
            String authorRelation,
            int likeCount,
            int commentCount,
            boolean liked,
            boolean mine,
            List<CommentDto> comments,
            LocalDateTime createdAt) {
    }

    public record CommentReq(@NotBlank(message = "评论内容不能为空") String content) {
    }

    public record LikeResp(boolean liked, long count) {
    }
}
