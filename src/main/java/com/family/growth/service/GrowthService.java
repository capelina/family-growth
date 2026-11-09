package com.family.growth.service;

import com.family.growth.common.BizException;
import com.family.growth.domain.*;
import com.family.growth.repo.GrowthMeasurementRepository;
import com.family.growth.repo.GrowthRecordRepository;
import com.family.growth.repo.MilestoneRepository;
import com.family.growth.repo.SkillRepository;
import com.family.growth.web.dto.GrowthDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Objects;

/**
 * 孩子成长档案：身高体重曲线 / 技能发展 / 成长里程碑 / 作品集。
 */
@Service
@RequiredArgsConstructor
public class GrowthService {

    private final GrowthMeasurementRepository measurementRepository;
    private final MilestoneRepository milestoneRepository;
    private final SkillRepository skillRepository;
    private final GrowthRecordRepository recordRepository;
    private final FamilyService familyService;

    @Transactional(readOnly = true)
    public GrowthDtos.GrowthProfileDto profile(Long memberId) {
        Family family = familyService.requireFamily();
        FamilyMember member = familyService.requireMember(memberId, family.getId());
        Long currentUserId = familyService.requireUser().getId();

        List<GrowthDtos.MeasurementDto> measurements = measurementRepository
                .findByMemberIdOrderByDateAsc(memberId).stream()
                .map(m -> new GrowthDtos.MeasurementDto(m.getId(), m.getMemberId(), m.getDate(),
                        m.getHeightCm(), m.getWeightKg(), m.getNote()))
                .toList();

        List<GrowthDtos.MilestoneDto> milestones = milestoneRepository
                .findByMemberIdOrderByDateDesc(memberId).stream()
                .map(m -> new GrowthDtos.MilestoneDto(m.getId(), m.getMemberId(), m.getTitle(), m.getDate(),
                        m.getDescription(), m.getIcon(), m.getCover(), m.getAchieved()))
                .toList();

        List<GrowthDtos.SkillDto> skills = skillRepository
                .findByMemberIdOrderByCategoryAscLevelDesc(memberId).stream()
                .map(s -> new GrowthDtos.SkillDto(s.getId(), s.getMemberId(), s.getName(), s.getCategory(),
                        s.getLevel(), s.getNote()))
                .toList();

        List<GrowthRecord> records = recordRepository.findByFamilyId(family.getId(), PageRequest.of(0, 2000))
                .getContent().stream()
                .filter(r -> Objects.equals(r.getAuthorMemberId(), memberId)
                        || r.getParticipantIds().contains(memberId))
                .toList();

        int photoCount = records.stream().mapToInt(r -> r.getMediaUrls().size()).sum();
        int taskDone = (int) records.stream().filter(r -> GrowthRecord.TYPE_TASK.equals(r.getType())).count();

        Integer ageMonths = member.getBirthday() == null ? null
                : (int) Period.between(member.getBirthday(), LocalDate.now()).toTotalMonths();

        String latestHeight = measurements.isEmpty() ? null
                : measurements.get(measurements.size() - 1).heightCm() + " cm";
        String latestWeight = measurements.isEmpty() ? null
                : measurements.get(measurements.size() - 1).weightKg() + " kg";

        return new GrowthDtos.GrowthProfileDto(
                familyService.toMemberDto(member, currentUserId),
                measurements, milestones, skills,
                ageMonths, records.size(), taskDone, photoCount, latestHeight, latestWeight);
    }

    @Transactional
    public GrowthDtos.MeasurementDto addMeasurement(Long memberId, GrowthDtos.MeasurementReq req) {
        familyService.requireParent();
        Family family = familyService.requireFamily();
        familyService.requireMember(memberId, family.getId());
        GrowthMeasurement m = new GrowthMeasurement();
        m.setMemberId(memberId);
        m.setDate(req.date() == null ? LocalDate.now() : req.date());
        m.setHeightCm(req.heightCm());
        m.setWeightKg(req.weightKg());
        m.setNote(req.note());
        measurementRepository.save(m);
        return new GrowthDtos.MeasurementDto(m.getId(), m.getMemberId(), m.getDate(),
                m.getHeightCm(), m.getWeightKg(), m.getNote());
    }

    @Transactional
    public void deleteMeasurement(Long id) {
        familyService.requireParent();
        GrowthMeasurement m = measurementRepository.findById(id)
                .orElseThrow(() -> new BizException("测量记录不存在"));
        familyService.requireMember(m.getMemberId(), familyService.currentFamilyId());
        measurementRepository.delete(m);
    }

    @Transactional
    public GrowthDtos.MilestoneDto addMilestone(Long memberId, GrowthDtos.MilestoneReq req) {
        familyService.requireParent();
        Family family = familyService.requireFamily();
        familyService.requireMember(memberId, family.getId());
        Milestone m = new Milestone();
        m.setMemberId(memberId);
        m.setTitle(req.title().trim());
        m.setDate(req.date() == null ? LocalDate.now() : req.date());
        m.setDescription(req.description());
        m.setIcon(req.icon() == null || req.icon().isBlank() ? "star" : req.icon());
        m.setCover(req.cover());
        m.setAchieved(Boolean.TRUE);
        milestoneRepository.save(m);
        return new GrowthDtos.MilestoneDto(m.getId(), m.getMemberId(), m.getTitle(), m.getDate(),
                m.getDescription(), m.getIcon(), m.getCover(), m.getAchieved());
    }

    @Transactional
    public void deleteMilestone(Long id) {
        familyService.requireParent();
        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new BizException("里程碑不存在"));
        familyService.requireMember(m.getMemberId(), familyService.currentFamilyId());
        milestoneRepository.delete(m);
    }

    @Transactional
    public GrowthDtos.SkillDto addSkill(Long memberId, GrowthDtos.SkillReq req) {
        familyService.requireParent();
        Family family = familyService.requireFamily();
        familyService.requireMember(memberId, family.getId());
        Skill s = new Skill();
        s.setMemberId(memberId);
        s.setName(req.name().trim());
        s.setCategory(req.category() == null || req.category().isBlank() ? "生活" : req.category());
        s.setLevel(req.level() == null ? 1 : Math.min(Math.max(req.level(), 1), 5));
        s.setNote(req.note());
        skillRepository.save(s);
        return new GrowthDtos.SkillDto(s.getId(), s.getMemberId(), s.getName(), s.getCategory(), s.getLevel(), s.getNote());
    }

    @Transactional
    public GrowthDtos.SkillDto updateSkill(Long id, GrowthDtos.SkillReq req) {
        familyService.requireParent();
        Skill s = skillRepository.findById(id).orElseThrow(() -> new BizException("技能不存在"));
        familyService.requireMember(s.getMemberId(), familyService.currentFamilyId());
        if (req.name() != null && !req.name().isBlank()) {
            s.setName(req.name().trim());
        }
        if (req.category() != null && !req.category().isBlank()) {
            s.setCategory(req.category());
        }
        if (req.level() != null) {
            s.setLevel(Math.min(Math.max(req.level(), 1), 5));
        }
        s.setNote(req.note());
        skillRepository.save(s);
        return new GrowthDtos.SkillDto(s.getId(), s.getMemberId(), s.getName(), s.getCategory(), s.getLevel(), s.getNote());
    }

    @Transactional
    public void deleteSkill(Long id) {
        familyService.requireParent();
        Skill s = skillRepository.findById(id).orElseThrow(() -> new BizException("技能不存在"));
        familyService.requireMember(s.getMemberId(), familyService.currentFamilyId());
        skillRepository.delete(s);
    }

    @Transactional(readOnly = true)
    public List<GrowthDtos.MilestoneDto> milestonesOf(Long memberId) {
        familyService.requireMember(memberId, familyService.currentFamilyId());
        return milestoneRepository.findByMemberIdOrderByDateDesc(memberId).stream()
                .map(m -> new GrowthDtos.MilestoneDto(m.getId(), m.getMemberId(), m.getTitle(), m.getDate(),
                        m.getDescription(), m.getIcon(), m.getCover(), m.getAchieved()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrowthDtos.MilestoneDto> recentMilestones(Long familyId, int limit) {
        List<FamilyMember> children = familyService.members(familyId).stream()
                .filter(m -> FamilyMember.ROLE_CHILD.equals(m.getRole()))
                .toList();
        return children.stream()
                .flatMap(c -> milestoneRepository.findByMemberIdOrderByDateDesc(c.getId()).stream())
                .sorted((a, b) -> {
                    LocalDate d1 = a.getDate() == null ? LocalDate.MIN : a.getDate();
                    LocalDate d2 = b.getDate() == null ? LocalDate.MIN : b.getDate();
                    return d2.compareTo(d1);
                })
                .limit(limit)
                .map(m -> new GrowthDtos.MilestoneDto(m.getId(), m.getMemberId(), m.getTitle(), m.getDate(),
                        m.getDescription(), m.getIcon(), m.getCover(), m.getAchieved()))
                .toList();
    }
}
