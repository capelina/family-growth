package com.family.growth.service;

import com.family.growth.common.BizException;
import com.family.growth.domain.Family;
import com.family.growth.domain.FamilyMember;
import com.family.growth.domain.Reward;
import com.family.growth.domain.RewardRedemption;
import com.family.growth.repo.FamilyMemberRepository;
import com.family.growth.repo.RewardRedemptionRepository;
import com.family.growth.repo.RewardRepository;
import com.family.growth.web.dto.RewardDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 家庭积分商城：家长上架商品，孩子用积分兑换奖励。
 */
@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardRepository rewardRepository;
    private final RewardRedemptionRepository redemptionRepository;
    private final FamilyMemberRepository memberRepository;
    private final FamilyService familyService;

    @Transactional(readOnly = true)
    public List<RewardDtos.RewardDto> list() {
        Family family = familyService.requireFamily();
        return rewardRepository.findByFamilyIdOrderByCreatedAtDesc(family.getId()).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public RewardDtos.RewardDto create(RewardDtos.RewardReq req) {
        familyService.requireParent();
        Family family = familyService.requireFamily();
        Reward reward = new Reward();
        reward.setFamilyId(family.getId());
        apply(reward, req);
        rewardRepository.save(reward);
        return toDto(reward);
    }

    @Transactional
    public RewardDtos.RewardDto update(Long id, RewardDtos.RewardReq req) {
        familyService.requireParent();
        Reward reward = requireReward(id);
        apply(reward, req);
        rewardRepository.save(reward);
        return toDto(reward);
    }

    @Transactional
    public void delete(Long id) {
        familyService.requireParent();
        rewardRepository.delete(requireReward(id));
    }

    /** 孩子用积分兑换商品 */
    @Transactional
    public RewardDtos.RedemptionDto redeem(Long rewardId) {
        Family family = familyService.requireFamily();
        Reward reward = requireReward(rewardId);
        if (!Reward.STATUS_ON.equals(reward.getStatus())) {
            throw new BizException("该商品已下架");
        }
        Long memberId;
        if (familyService.isChild()) {
            memberId = familyService.currentMember().getId();
        } else {
            memberId = familyService.members(family.getId()).stream()
                    .filter(m -> FamilyMember.ROLE_CHILD.equals(m.getRole()))
                    .map(FamilyMember::getId).findFirst()
                    .orElseThrow(() -> new BizException("请先添加孩子成员"));
        }
        FamilyMember member = familyService.requireMember(memberId, family.getId());
        int balance = member.getPoints() == null ? 0 : member.getPoints();
        int cost = reward.getCostPoints() == null ? 0 : reward.getCostPoints();
        if (balance < cost) {
            throw new BizException("积分不足，还差 " + (cost - balance) + " 积分");
        }
        member.setPoints(balance - cost);
        memberRepository.save(member);

        RewardRedemption redemption = new RewardRedemption();
        redemption.setFamilyId(family.getId());
        redemption.setRewardId(reward.getId());
        redemption.setMemberId(member.getId());
        redemption.setCostPoints(cost);
        redemption.setRewardName(reward.getName());
        redemptionRepository.save(redemption);
        return toRedemptionDto(redemption, member);
    }

    /** 兑换记录（家长看全部；孩子只看自己的） */
    @Transactional(readOnly = true)
    public List<RewardDtos.RedemptionDto> redemptions() {
        Long familyId = familyService.currentFamilyId();
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        Long selfId = familyService.isChild()
                ? familyService.currentMember().getId() : null;
        return redemptionRepository.findByFamilyIdOrderByCreatedAtDesc(familyId).stream()
                .filter(r -> selfId == null || selfId.equals(r.getMemberId()))
                .map(r -> toRedemptionDto(r, members.get(r.getMemberId())))
                .toList();
    }

    /** 家长标记奖励已兑现 */
    @Transactional
    public RewardDtos.RedemptionDto markDone(Long redemptionId) {
        familyService.requireParent();
        Long familyId = familyService.currentFamilyId();
        RewardRedemption redemption = redemptionRepository.findById(redemptionId)
                .orElseThrow(() -> new BizException("兑换记录不存在"));
        if (!redemption.getFamilyId().equals(familyId)) {
            throw new BizException("无权操作该记录");
        }
        redemption.setStatus(RewardRedemption.STATUS_DONE);
        redemptionRepository.save(redemption);
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        return toRedemptionDto(redemption, members.get(redemption.getMemberId()));
    }

    private void apply(Reward reward, RewardDtos.RewardReq req) {
        if (req.costPoints() == null || req.costPoints() < 0) {
            throw new BizException("所需积分不能为负数");
        }
        reward.setName(req.name().trim());
        reward.setDescription(req.description());
        reward.setImage(req.image());
        reward.setCostPoints(req.costPoints());
        if (req.status() != null && !req.status().isBlank()) {
            reward.setStatus(Reward.STATUS_OFF.equalsIgnoreCase(req.status()) ? Reward.STATUS_OFF : Reward.STATUS_ON);
        }
    }

    private Reward requireReward(Long id) {
        Reward reward = rewardRepository.findById(id).orElseThrow(() -> new BizException("商品不存在"));
        if (!reward.getFamilyId().equals(familyService.currentFamilyId())) {
            throw new BizException("无权操作该商品");
        }
        return reward;
    }

    private RewardDtos.RewardDto toDto(Reward r) {
        return new RewardDtos.RewardDto(r.getId(), r.getName(), r.getDescription(), r.getImage(),
                r.getCostPoints(), r.getStatus(), r.getCreatedAt());
    }

    private RewardDtos.RedemptionDto toRedemptionDto(RewardRedemption r, FamilyMember member) {
        return new RewardDtos.RedemptionDto(r.getId(), r.getRewardId(), r.getRewardName(),
                r.getMemberId(), member == null ? null : member.getName(),
                member == null ? null : member.getAvatar(),
                r.getCostPoints(), r.getStatus(), r.getCreatedAt());
    }
}
