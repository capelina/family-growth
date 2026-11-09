package com.family.growth.service;

import com.family.growth.common.BizException;
import com.family.growth.auth.AuthContext;
import com.family.growth.domain.Family;
import com.family.growth.domain.FamilyMember;
import com.family.growth.domain.User;
import com.family.growth.domain.UserSession;
import com.family.growth.repo.FamilyMemberRepository;
import com.family.growth.repo.FamilyRepository;
import com.family.growth.repo.UserRepository;
import com.family.growth.repo.UserSessionRepository;
import com.family.growth.web.dto.AuthDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 注册 / 登录 / 会话。
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int SESSION_DAYS = 30;

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final FamilyMemberRepository memberRepository;
    private final FamilyRepository familyRepository;
    private final FamilyService familyService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 注册。两种身份：
     * - 家长（PARENT）：填写家庭名称，自动创建一个家庭并成为家长成员；
     * - 亲子成员（CHILD）：凭家长分享的邀请码加入已有家庭，成为孩子成员。
     */
    @Transactional
    public AuthDtos.AuthResp register(AuthDtos.RegisterReq req) {
        String username = req.username().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BizException("该用户名已被注册");
        }
        boolean asChild = User.ROLE_CHILD.equalsIgnoreCase(req.role() == null ? "" : req.role().trim());

        // 亲子身份需要先校验邀请码
        Family joinedFamily = null;
        if (asChild) {
            String code = req.inviteCode() == null ? "" : req.inviteCode().trim().toUpperCase();
            if (code.isBlank()) {
                throw new BizException("请输入家长给你的邀请码");
            }
            joinedFamily = familyRepository.findByInviteCode(code)
                    .orElseThrow(() -> new BizException("邀请码无效，请向家长确认后重试"));
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setNickname(req.nickname() == null || req.nickname().isBlank() ? username : req.nickname().trim());
        user.setRole(asChild ? User.ROLE_CHILD : User.ROLE_PARENT);
        userRepository.save(user);

        if (asChild) {
            user.setFamilyId(joinedFamily.getId());
            userRepository.save(user);

            FamilyMember member = new FamilyMember();
            member.setFamilyId(joinedFamily.getId());
            member.setUserId(user.getId());
            member.setName(user.getNickname());
            member.setRole(FamilyMember.ROLE_CHILD);
            member.setRelation("孩子");
            member.setColor("#2E9E8F");
            member.setPoints(0);
            memberRepository.save(member);
        } else {
            String familyName = req.familyName() == null || req.familyName().isBlank()
                    ? user.getNickname() + " 的家庭"
                    : req.familyName().trim();
            Family family = familyService.createFamily(user.getId(), familyName);
            user.setFamilyId(family.getId());
            userRepository.save(user);

            FamilyMember owner = new FamilyMember();
            owner.setFamilyId(family.getId());
            owner.setUserId(user.getId());
            owner.setName(user.getNickname());
            owner.setRole(FamilyMember.ROLE_PARENT);
            owner.setRelation("家长");
            owner.setColor("#F4573B");
            owner.setPoints(0);
            memberRepository.save(owner);
        }

        return buildAuth(user);
    }

    @Transactional
    public AuthDtos.AuthResp login(AuthDtos.LoginReq req) {
        User user = userRepository.findByUsername(req.username().trim())
                .orElseThrow(() -> new BizException("用户名或密码不正确"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BizException("用户名或密码不正确");
        }
        return buildAuth(user);
    }

    public boolean usernameAvailable(String username) {
        return username != null && !username.isBlank() && !userRepository.existsByUsername(username.trim());
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessionRepository.findByToken(token).ifPresent(sessionRepository::delete);
        }
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResp current() {
        User user = familyService.requireUser();
        return toAuthResp(user, null);
    }

    private AuthDtos.AuthResp buildAuth(User user) {
        UserSession session = new UserSession();
        session.setToken(UUID.randomUUID().toString().replace("-", ""));
        session.setUserId(user.getId());
        session.setExpiresAt(LocalDateTime.now().plusDays(SESSION_DAYS));
        sessionRepository.save(session);
        return toAuthResp(user, session.getToken());
    }

    private AuthDtos.AuthResp toAuthResp(User user, String token) {
        Long memberId = user.getFamilyId() == null ? null
                : memberRepository.findByFamilyIdAndUserIdAndRole(user.getFamilyId(), user.getId(), user.effectiveRole())
                        .map(FamilyMember::getId).orElse(null);
        AuthDtos.UserDto userDto = new AuthDtos.UserDto(
                user.getId(), user.getUsername(), user.getNickname(),
                user.getAvatar(), user.getEmail(), user.getPhone(), user.effectiveRole(), memberId);
        var family = user.getFamilyId() == null
                ? null
                : familyService.familyDto(user.getFamilyId(), user.getId());
        return new AuthDtos.AuthResp(token, userDto, family);
    }

    /** 供其它服务使用：当前登录用户 ID */
    public Long currentUserId() {
        return AuthContext.require();
    }
}
