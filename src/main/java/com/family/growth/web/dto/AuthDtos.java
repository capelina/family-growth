package com.family.growth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 认证相关 DTO。
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterReq(
            @NotBlank(message = "用户名不能为空") @Size(min = 2, max = 40, message = "用户名长度 2-40") String username,
            @NotBlank(message = "密码不能为空") @Size(min = 6, max = 60, message = "密码至少 6 位") String password,
            String nickname,
            /** 身份：PARENT（家长）或 CHILD（亲子成员） */
            String role,
            String familyName,
            String inviteCode) {
    }

    public record LoginReq(
            @NotBlank(message = "用户名不能为空") String username,
            @NotBlank(message = "密码不能为空") String password) {
    }

    public record UserDto(
            Long id,
            String username,
            String nickname,
            String avatar,
            String email,
            String phone,
            String role,
            Long memberId) {
    }

    public record AuthResp(
            String token,
            UserDto user,
            FamilyDtos.FamilyDto family) {
    }
}
