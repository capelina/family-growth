package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 任务 DTO。
 */
public final class TaskDtos {

    private TaskDtos() {
    }

    public record SubmissionDto(
            Long id,
            Long taskId,
            Long memberId,
            String memberName,
            String memberAvatar,
            String note,
            List<String> mediaUrls,
            String status,
            String reviewComment,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt) {
    }

    public record TaskDto(
            Long id,
            String title,
            String description,
            String taskMode,
            LocalDateTime deadline,
            Integer durationMinutes,
            Boolean requireProof,
            String submitMode,
            Integer points,
            String category,
            String status,
            Long assigneeMemberId,
            String assigneeName,
            String assigneeAvatar,
            Long startedByMemberId,
            LocalDateTime startedAt,
            LocalDateTime expiresAt,
            LocalDateTime createdAt,
            int submissionCount,
            String latestStatus,
            List<SubmissionDto> submissions) {
    }

    public record TaskReq(
            @NotBlank(message = "任务标题不能为空") String title,
            String description,
            String taskMode,
            LocalDateTime deadline,
            Integer durationMinutes,
            Boolean requireProof,
            String submitMode,
            Integer points,
            Long assigneeMemberId,
            String category) {
    }

    public record SubmitReq(Long memberId, String note, List<String> mediaUrls) {
    }

    public record ReviewReq(Long submissionId, Boolean approve, String comment) {
    }
}
