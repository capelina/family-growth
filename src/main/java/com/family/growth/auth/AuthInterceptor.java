package com.family.growth.auth;

import com.family.growth.common.BizException;
import com.family.growth.domain.User;
import com.family.growth.domain.UserSession;
import com.family.growth.repo.UserRepository;
import com.family.growth.repo.UserSessionRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final UserSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String token = resolveToken(request);
        if (token == null) {
            throw new BizException(401, "未登录");
        }
        UserSession session = sessionRepository.findByToken(token)
                .orElseThrow(() -> new BizException(401, "登录状态已失效，请重新登录"));
        if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessionRepository.delete(session);
            throw new BizException(401, "登录已过期，请重新登录");
        }
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new BizException(401, "账号不存在"));
        AuthContext.set(user.getId());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AuthContext.clear();
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        String token = request.getHeader("X-Token");
        if (token != null && !token.isBlank()) {
            return token.trim();
        }
        return Optional.ofNullable(request.getParameter("token")).filter(t -> !t.isBlank()).orElse(null);
    }
}
