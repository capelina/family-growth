package com.family.growth.service;

import com.family.growth.common.BizException;
import com.family.growth.auth.AuthContext;
import com.family.growth.domain.Family;
import com.family.growth.domain.FamilyMember;
import com.family.growth.domain.User;
import com.family.growth.repo.FamilyMemberRepository;
import com.family.growth.repo.FamilyRepository;
import com.family.growth.repo.GrowthRecordRepository;
import com.family.growth.repo.TaskRepository;
import com.family.growth.repo.UserRepository;
import com.family.growth.web.dto.FamilyDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.Period;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 家庭与成员管理。
 */
@Service
@RequiredArgsConstructor
public class FamilyService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository memberRepository;
    private final GrowthRecordRepository recordRepository;
    private final TaskRepository taskRepository;

    public User requireUser() {
        return userRepository.findById(AuthContext.require())
                .orElseThrow(() -> new BizException(401, "账号不存在"));
    }

    /** 当前账号是否为亲子成员 */
    public boolean isChild() {
        return requireUser().isChild();
    }

    /** 家长专属操作守卫：亲子成员不可发布任务、管理家庭等 */
    public void requireParent() {
        if (requireUser().isChild()) {
            throw new BizException(403, "该操作仅限家长账号使用");
        }
    }

    public Family requireFamily() {
        User user = requireUser();
        return requireFamily(user);
    }

    public Family requireFamily(User user) {
        if (user.getFamilyId() == null) {
            throw new BizException("您还没有创建或加入家庭");
        }
        return familyRepository.findById(user.getFamilyId())
                .orElseThrow(() -> new BizException("家庭不存在"));
    }

    public Long currentFamilyId() {
        return requireFamily().getId();
    }

    public List<FamilyMember> members(Long familyId) {
        return memberRepository.findByFamilyIdOrderByIdAsc(familyId);
    }

    public Map<Long, FamilyMember> memberMap(Long familyId) {
        return members(familyId).stream()
                .collect(Collectors.toMap(FamilyMember::getId, Function.identity(), (a, b) -> a));
    }

    public FamilyMember requireMember(Long memberId, Long familyId) {
        FamilyMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BizException("成员不存在"));
        if (!member.getFamilyId().equals(familyId)) {
            throw new BizException("无权访问该成员");
        }
        return member;
    }

    /** 当前登录用户在本家庭中的成员档案（按账号身份匹配，避免同一账号有多份档案时歧义） */
    public FamilyMember currentMember() {
        Family family = requireFamily();
        User user = requireUser();
        return memberRepository.findByFamilyIdAndUserIdAndRole(family.getId(), user.getId(), user.effectiveRole())
                .orElseThrow(() -> new BizException("当前账号还未绑定家庭成员档案"));
    }

    /** 当前账号在本家庭中的成员档案（可能为空，不抛异常） */
    public Optional<FamilyMember> currentMemberOrEmpty() {
        User user = requireUser();
        if (user.getFamilyId() == null) {
            return Optional.empty();
        }
        return memberRepository.findByFamilyIdAndUserIdAndRole(user.getFamilyId(), user.getId(), user.effectiveRole());
    }

    public String generateInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (familyRepository.existsByInviteCode(code));
        return code;
    }

    @Transactional
    public Family createFamily(Long ownerUserId, String name) {
        Family family = new Family();
        family.setName(name == null || name.isBlank() ? "我的家庭" : name.trim());
        family.setInviteCode(generateInviteCode());
        family.setOwnerUserId(ownerUserId);
        family.setMotto("陪伴是最长情的告白");
        return familyRepository.save(family);
    }

    @Transactional
    public FamilyDtos.FamilyDto familyDto(long familyId) {
        return familyDto(familyId, AuthContext.require());
    }

    @Transactional
    public FamilyDtos.FamilyDto familyDto(long familyId, Long currentUserId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new BizException("家庭不存在"));
        String currentUserRole = currentUserId == null ? null
                : userRepository.findById(currentUserId).map(User::effectiveRole).orElse(null);
        List<FamilyDtos.MemberDto> members = members(familyId).stream()
                .map(m -> toMemberDto(m, currentUserId, currentUserRole))
                .sorted(Comparator.comparing((FamilyDtos.MemberDto m) -> !"PARENT".equals(m.role()))
                        .thenComparing(FamilyDtos.MemberDto::id))
                .toList();
        return new FamilyDtos.FamilyDto(
                family.getId(),
                family.getName(),
                family.getMotto(),
                family.getCover(),
                family.getInviteCode(),
                members,
                recordRepository.countByFamilyId(familyId),
                taskRepository.countByFamilyId(familyId));
    }

    public FamilyDtos.MemberDto toMemberDto(FamilyMember member, Long currentUserId) {
        String currentUserRole = currentUserId == null ? null
                : userRepository.findById(currentUserId).map(User::effectiveRole).orElse(null);
        return toMemberDto(member, currentUserId, currentUserRole);
    }

    public FamilyDtos.MemberDto toMemberDto(FamilyMember member, Long currentUserId, String currentUserRole) {
        Integer age = member.getBirthday() == null
                ? null
                : Period.between(member.getBirthday(), LocalDate.now()).getYears();
        // 同一账号可能有多份成员档案（家长 + 孩子），只有身份匹配的那份才算「我」
        boolean isMe = member.getUserId() != null && member.getUserId().equals(currentUserId)
                && member.getRole() != null && member.getRole().equals(currentUserRole);
        return new FamilyDtos.MemberDto(
                member.getId(),
                member.getUserId(),
                member.getName(),
                member.getRole(),
                member.getRelation(),
                member.getAvatar(),
                member.getBirthday(),
                age,
                member.getPoints(),
                member.getColor(),
                isMe);
    }

    @Transactional
    public FamilyDtos.FamilyDto updateFamily(FamilyDtos.FamilyUpdateReq req) {
        requireParent();
        Family family = requireFamily();
        if (req.name() != null && !req.name().isBlank()) {
            family.setName(req.name().trim());
        }
        if (req.motto() != null) {
            family.setMotto(req.motto());
        }
        if (req.cover() != null) {
            family.setCover(req.cover());
        }
        familyRepository.save(family);
        return familyDto(family.getId());
    }

    @Transactional
    public FamilyDtos.FamilyDto regenerateInviteCode() {
        requireParent();
        Family family = requireFamily();
        family.setInviteCode(generateInviteCode());
        familyRepository.save(family);
        return familyDto(family.getId());
    }

    @Transactional
    public FamilyDtos.FamilyDto addMember(FamilyDtos.MemberReq req) {
        requireParent();
        Family family = requireFamily();
        FamilyMember member = new FamilyMember();
        member.setFamilyId(family.getId());
        member.setName(req.name().trim());
        member.setRole("PARENT".equals(req.role()) ? FamilyMember.ROLE_PARENT : FamilyMember.ROLE_CHILD);
        member.setRelation(req.relation());
        member.setAvatar(req.avatar());
        member.setBirthday(req.birthday());
        member.setColor(req.color() == null || req.color().isBlank() ? pickColor(family.getId()) : req.color());
        memberRepository.save(member);
        return familyDto(family.getId());
    }

    @Transactional
    public FamilyDtos.FamilyDto updateMember(Long memberId, FamilyDtos.MemberReq req) {
        requireParent();
        Family family = requireFamily();
        FamilyMember member = requireMember(memberId, family.getId());
        member.setName(req.name().trim());
        if (req.role() != null) {
            member.setRole("PARENT".equals(req.role()) ? FamilyMember.ROLE_PARENT : FamilyMember.ROLE_CHILD);
        }
        member.setRelation(req.relation());
        if (req.avatar() != null && !req.avatar().isBlank()) {
            member.setAvatar(req.avatar());
        }
        member.setBirthday(req.birthday());
        if (req.color() != null && !req.color().isBlank()) {
            member.setColor(req.color());
        }
        memberRepository.save(member);
        return familyDto(family.getId());
    }

    @Transactional
    public FamilyDtos.FamilyDto deleteMember(Long memberId) {
        requireParent();
        Family family = requireFamily();
        FamilyMember member = requireMember(memberId, family.getId());
        if (member.getUserId() != null && member.getUserId().equals(AuthContext.require())) {
            throw new BizException("不能删除自己");
        }
        memberRepository.delete(member);
        return familyDto(family.getId());
    }

    /** 通过邀请码加入家庭（家长以家长身份、亲子以孩子身份加入） */
    @Transactional
    public FamilyDtos.FamilyDto joinByInviteCode(String inviteCode) {
        User user = requireUser();
        if (user.getFamilyId() != null) {
            throw new BizException("您已经在一个家庭中了");
        }
        String code = inviteCode == null ? "" : inviteCode.trim().toUpperCase();
        Family family = familyRepository.findByInviteCode(code)
                .orElseThrow(() -> new BizException("邀请码无效"));
        user.setFamilyId(family.getId());
        userRepository.save(user);

        boolean asChild = user.isChild();
        FamilyMember member = new FamilyMember();
        member.setFamilyId(family.getId());
        member.setUserId(user.getId());
        member.setName(user.getNickname() == null || user.getNickname().isBlank() ? user.getUsername() : user.getNickname());
        member.setRole(asChild ? FamilyMember.ROLE_CHILD : FamilyMember.ROLE_PARENT);
        member.setRelation(asChild ? "孩子" : "家长");
        member.setAvatar(user.getAvatar());
        member.setColor(pickColor(family.getId()));
        member.setPoints(0);
        memberRepository.save(member);
        return familyDto(family.getId());
    }

    private String pickColor(Long familyId) {
        String[] palette = {"#F4573B", "#2E9E8F", "#E8A33D", "#5B8DEF", "#A768D6", "#3FA06A"};
        return palette[(int) (Math.abs(familyId == null ? 1 : familyId) % palette.length)];
    }
}
