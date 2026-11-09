package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.AuthService;
import com.family.growth.web.dto.AuthDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** 注册：家长账号 + 自动创建家庭 */
    @PostMapping("/register")
    public ApiResponse<AuthDtos.AuthResp> register(@Valid @RequestBody AuthDtos.RegisterReq req) {
        return ApiResponse.ok(authService.register(req));
    }

    /** 登录 */
    @PostMapping("/login")
    public ApiResponse<AuthDtos.AuthResp> login(@Valid @RequestBody AuthDtos.LoginReq req) {
        return ApiResponse.ok(authService.login(req));
    }

    /** 退出登录 */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim() : null;
        authService.logout(token);
        return ApiResponse.ok();
    }

    /** 当前登录信息 */
    @GetMapping("/me")
    public ApiResponse<AuthDtos.AuthResp> me() {
        return ApiResponse.ok(authService.current());
    }

    /** 用户名是否可用 */
    @GetMapping("/check-username")
    public ApiResponse<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        return ApiResponse.ok(Map.of("available", authService.usernameAvailable(username)));
    }
}
