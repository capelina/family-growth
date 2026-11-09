package com.family.growth.auth;

import com.family.growth.common.BizException;

/**
 * 保存当前请求的登录用户 ID。
 */
public final class AuthContext {

    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void set(Long userId) {
        USER_ID.set(userId);
    }

    public static Long get() {
        return USER_ID.get();
    }

    public static Long require() {
        Long id = USER_ID.get();
        if (id == null) {
            throw new BizException(401, "未登录或登录已过期");
        }
        return id;
    }

    public static void clear() {
        USER_ID.remove();
    }
}
