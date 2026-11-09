package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

/**
 * 家庭与成员 DTO。
 */
public final class FamilyDtos {

    private FamilyDtos() {
    }

    public record MemberDto(
            Long id,
            Long userId,
            String name,
            String role,
            String relation,
            String avatar,
            LocalDate birthday,
            Integer age,
            Integer points,
            String color,
            Boolean isMe) {
    }

    public record FamilyDto(
            Long id,
            String name,
            String motto,
            String cover,
            String inviteCode,
            List<MemberDto> members,
            long recordCount,
            long taskCount) {
    }

    public record FamilyUpdateReq(String name, String motto, String cover) {
    }

    public record MemberReq(
            @NotBlank(message = "成员姓名不能为空") String name,
            String role,
            String relation,
            String avatar,
            LocalDate birthday,
            String color) {
    }

    public record JoinReq(@NotBlank(message = "邀请码不能为空") String inviteCode) {
    }
}
