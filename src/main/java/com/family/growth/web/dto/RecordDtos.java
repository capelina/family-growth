package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 亲子记录 DTO。
 */
public final class RecordDtos {

    private RecordDtos() {
    }

    public record ParticipantDto(Long id, String name, String avatar, String relation, String role) {
    }

    public record RecordDto(
            Long id,
            String type,
            String title,
            String content,
            String category,
            LocalDate recordDate,
            String visibility,
            String status,
            String location,
            Integer points,
            List<String> mediaUrls,
            List<ParticipantDto> participants,
            Long authorMemberId,
            String authorName,
            String authorAvatar,
            String authorRelation,
            Long taskId,
            String taskTitle,
            LocalDateTime taskDeadline,
            Integer likeCount,
            Integer commentCount,
            Boolean liked,
            Boolean isMine,
            LocalDateTime createdAt) {
    }

    /** 家长审核记录：approve=true 通过（可顺带设为公开），false 退回 */
    public record RecordReviewReq(Boolean approve, Boolean toPublic) {
    }

    public record RecordReq(
            String type,
            @NotBlank(message = "标题不能为空") String title,
            String content,
            String category,
            LocalDate recordDate,
            String visibility,
            String location,
            List<Long> participantIds,
            List<String> mediaUrls,
            Long taskId) {
    }

    public record CategoryStat(String name, long count) {
    }

    public record PageResp<T>(List<T> items, long total, int page, int size, int totalPages) {
    }
}
