package com.family.growth.service;

import com.family.growth.common.BizException;
import com.family.growth.domain.Family;
import com.family.growth.domain.FamilyMember;
import com.family.growth.domain.GrowthRecord;
import com.family.growth.domain.Task;
import com.family.growth.domain.TaskSubmission;
import com.family.growth.repo.FamilyMemberRepository;
import com.family.growth.repo.GrowthRecordRepository;
import com.family.growth.repo.PlazaCommentRepository;
import com.family.growth.repo.PlazaLikeRepository;
import com.family.growth.repo.TaskRepository;
import com.family.growth.repo.TaskSubmissionRepository;
import com.family.growth.web.dto.RecordDtos;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 亲子记录：自由记录 + 任务记录。
 */
@Service
@RequiredArgsConstructor
public class RecordService {

    private final GrowthRecordRepository recordRepository;
    private final PlazaLikeRepository likeRepository;
    private final PlazaCommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final TaskSubmissionRepository submissionRepository;
    private final FamilyMemberRepository memberRepository;
    private final FamilyService familyService;

    @Transactional(readOnly = true)
    public RecordDtos.PageResp<RecordDtos.RecordDto> page(Long familyId, Long currentUserId,
                                                          String type, String category, Long memberId,
                                                          String month, String keyword,
                                                          int page, int size) {
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), 60);
        Specification<GrowthRecord> spec = buildSpec(familyId, type, category, memberId, month, keyword);
        Page<GrowthRecord> result = recordRepository.findAll(spec,
                PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "recordDate")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt"))));
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        List<RecordDtos.RecordDto> items = result.getContent().stream()
                .filter(r -> visibleToCurrentUser(r))
                .map(r -> toDto(r, members, currentUserId))
                .toList();
        return new RecordDtos.PageResp<>(items, result.getTotalElements(), p, s, result.getTotalPages());
    }

    private Specification<GrowthRecord> buildSpec(Long familyId, String type, String category,
                                                  Long memberId, String month, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("familyId"), familyId));
            if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (category != null && !category.isBlank() && !"全部".equals(category)) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (memberId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("authorMemberId"), memberId),
                        cb.isMember(memberId, root.get("participantIds"))));
            }
            if (month != null && !month.isBlank() && month.matches("\\d{4}-\\d{2}")) {
                YearMonth ym = YearMonth.parse(month);
                predicates.add(cb.between(root.get("recordDate"), ym.atDay(1), ym.atEndOfMonth()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(cb.like(root.get("title"), like), cb.like(root.get("content"), like)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional(readOnly = true)
    public RecordDtos.RecordDto detail(Long id) {
        Long familyId = familyService.currentFamilyId();
        GrowthRecord record = requireRecord(id, familyId);
        return toDto(record, familyService.memberMap(familyId), Objects.requireNonNull(familyService.requireUser().getId()));
    }

    @Transactional
    public RecordDtos.RecordDto create(RecordDtos.RecordReq req) {
        Family family = familyService.requireFamily();
        boolean child = familyService.isChild();
        FamilyMember author = currentAuthor(family.getId(), req.participantIds());
        GrowthRecord record = new GrowthRecord();
        record.setFamilyId(family.getId());
        Task linkedTask = apply(record, req);
        if (linkedTask != null) {
            validateTaskOpen(linkedTask);
        }
        record.setAuthorMemberId(author == null ? null : author.getId());
        // 亲子提交的记录：待家长审核后才生效
        record.setStatus(child ? GrowthRecord.STATUS_PENDING : GrowthRecord.STATUS_APPROVED);
        recordRepository.save(record);
        if (linkedTask != null) {
            boolean approved = GrowthRecord.STATUS_APPROVED.equals(record.getStatus());
            mirrorSubmission(record, approved ? TaskSubmission.STATUS_APPROVED : TaskSubmission.STATUS_PENDING);
            if (approved) {
                // 家长直接提交的任务记录：立即发放任务积分
                completeTaskRecord(record);
            }
        }
        return toDto(record, familyService.memberMap(family.getId()), familyService.requireUser().getId());
    }

    @Transactional
    public RecordDtos.RecordDto update(Long id, RecordDtos.RecordReq req) {
        Long familyId = familyService.currentFamilyId();
        GrowthRecord record = requireRecord(id, familyId);
        boolean child = familyService.isChild();
        if (child) {
            requireOwnPendingRecord(record);
        }
        Task linkedTask = apply(record, req);
        if (child) {
            // 修改后重新进入待审核
            record.setStatus(GrowthRecord.STATUS_PENDING);
        }
        recordRepository.save(record);
        if (child && linkedTask != null && GrowthRecord.STATUS_PENDING.equals(record.getStatus())) {
            refreshPendingMirror(record);
        }
        return toDto(record, familyService.memberMap(familyId), familyService.requireUser().getId());
    }

    @Transactional
    public void delete(Long id) {
        Long familyId = familyService.currentFamilyId();
        GrowthRecord record = requireRecord(id, familyId);
        if (familyService.isChild()) {
            requireOwnPendingRecord(record);
        }
        if (record.getTaskId() != null && record.getAuthorMemberId() != null) {
            // 同步清理任务看板上未审核的镜像提交
            submissionRepository.findByTaskIdOrderBySubmittedAtDesc(record.getTaskId()).stream()
                    .filter(s -> record.getAuthorMemberId().equals(s.getMemberId()))
                    .filter(s -> TaskSubmission.STATUS_PENDING.equals(s.getStatus()))
                    .forEach(submissionRepository::delete);
        }
        commentRepository.deleteByRecordId(record.getId());
        recordRepository.delete(record);
    }

    /** 家长审核亲子提交的记录 */
    @Transactional
    public RecordDtos.RecordDto review(Long id, RecordDtos.RecordReviewReq req) {
        familyService.requireParent();
        Long familyId = familyService.currentFamilyId();
        GrowthRecord record = requireRecord(id, familyId);
        boolean wasPending = GrowthRecord.STATUS_PENDING.equals(record.getStatus());
        boolean approve = req.approve() == null || req.approve();
        if (approve) {
            record.setStatus(GrowthRecord.STATUS_APPROVED);
            if (Boolean.TRUE.equals(req.toPublic())) {
                record.setVisibility(GrowthRecord.VISIBILITY_PUBLIC);
            }
        } else {
            record.setStatus(GrowthRecord.STATUS_REJECTED);
            record.setVisibility(GrowthRecord.VISIBILITY_PRIVATE);
        }
        recordRepository.save(record);
        // 任务记录：通过后发放任务积分并关闭任务；同时同步看板镜像提交
        if (record.getTaskId() != null && wasPending) {
            if (approve) {
                completeTaskRecord(record);
            }
            syncMirrorSubmissions(record, approve);
        }
        return toDto(record, familyService.memberMap(familyId), familyService.requireUser().getId());
    }

    /** 亲子只能修改/删除自己提交且未通过审核的记录 */
    private void requireOwnPendingRecord(GrowthRecord record) {
        FamilyMember self = familyService.currentMember();
        if (record.getAuthorMemberId() == null || !record.getAuthorMemberId().equals(self.getId())) {
            throw new BizException("只能操作自己提交的记录");
        }
        if (GrowthRecord.STATUS_APPROVED.equals(record.getStatus())) {
            throw new BizException("已通过审核的记录不能修改，请联系家长");
        }
    }

    @Transactional(readOnly = true)
    public List<RecordDtos.CategoryStat> categories() {
        Long familyId = familyService.currentFamilyId();
        Map<String, Long> counter = new LinkedHashMap<>();
        for (GrowthRecord record : recordRepository.findByFamilyId(familyId, PageRequest.of(0, 1000)).getContent()) {
            String key = record.getCategory() == null || record.getCategory().isBlank() ? "未分类" : record.getCategory();
            counter.merge(key, 1L, Long::sum);
        }
        return counter.entrySet().stream()
                .map(e -> new RecordDtos.CategoryStat(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(RecordDtos.CategoryStat::count).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecordDtos.RecordDto> photoWall(Long familyId, Long currentUserId, int limit) {
        Specification<GrowthRecord> spec = (root, query, cb) -> {
            query.distinct(true);
            return cb.equal(root.get("familyId"), familyId);
        };
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        return recordRepository.findAll(spec, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream()
                .filter(r -> !r.getMediaUrls().isEmpty())
                .map(r -> toDto(r, members, currentUserId))
                .toList();
    }

    /**
     * 填充记录字段并返回关联的任务。
     * 积分规则：只有关联家长发布任务的记录才有积分（取任务积分），普通记录一律 0 分。
     */
    private Task apply(GrowthRecord record, RecordDtos.RecordReq req) {
        record.setTitle(req.title().trim());
        record.setContent(req.content());
        record.setCategory(req.category());
        record.setRecordDate(req.recordDate() == null ? LocalDate.now() : req.recordDate());
        // 公开到广场仅限家长操作；亲子一律仅家庭可见
        boolean allowPublic = !familyService.isChild();
        record.setVisibility(allowPublic && GrowthRecord.VISIBILITY_PUBLIC.equals(req.visibility())
                ? GrowthRecord.VISIBILITY_PUBLIC : GrowthRecord.VISIBILITY_PRIVATE);
        record.setLocation(req.location());
        record.setMediaUrls(req.mediaUrls() == null ? new ArrayList<>() : new ArrayList<>(req.mediaUrls()));
        record.setParticipantIds(req.participantIds() == null ? new ArrayList<>() : new ArrayList<>(req.participantIds()));
        Task linkedTask = null;
        if (req.taskId() != null) {
            linkedTask = taskRepository.findById(req.taskId())
                    .filter(t -> t.getFamilyId().equals(record.getFamilyId()))
                    .orElseThrow(() -> new BizException("关联的任务不存在"));
        }
        if (linkedTask != null) {
            record.setTaskId(linkedTask.getId());
            record.setType(GrowthRecord.TYPE_TASK);
            record.setPoints(linkedTask.getPoints() == null ? 0 : linkedTask.getPoints());
        } else {
            record.setTaskId(null);
            record.setType(GrowthRecord.TYPE_FREE);
            record.setPoints(0);
        }
        return linkedTask;
    }

    /** 新提交任务记录前校验任务状态（已删除/编辑旧记录时不校验） */
    private void validateTaskOpen(Task task) {
        if (Task.STATUS_CLOSED.equals(task.getStatus())) {
            throw new BizException("该任务已结束，无法再提交记录");
        }
        if (Task.MODE_DURATION.equals(task.getTaskMode())) {
            if (task.getStartedAt() == null) {
                throw new BizException("该任务为限时任务，请先在任务看板点击「开始」");
            }
            if (task.getExpiresAt() != null && LocalDateTime.now().isAfter(task.getExpiresAt())) {
                throw new BizException("限时已结束，任务超时未完成");
            }
        }
    }

    /** 任务记录审核通过：给记录作者发放任务积分并关闭任务 */
    private void completeTaskRecord(GrowthRecord record) {
        Task task = taskRepository.findById(record.getTaskId()).orElse(null);
        if (task == null) {
            return;
        }
        int points = task.getPoints() == null ? 0 : task.getPoints();
        if (record.getAuthorMemberId() != null && points > 0) {
            FamilyMember author = memberRepository.findById(record.getAuthorMemberId()).orElse(null);
            if (author != null) {
                author.setPoints((author.getPoints() == null ? 0 : author.getPoints()) + points);
                memberRepository.save(author);
            }
        }
        if (!Task.STATUS_CLOSED.equals(task.getStatus())) {
            task.setStatus(Task.STATUS_CLOSED);
            taskRepository.save(task);
        }
    }

    /** 在任务看板生成镜像提交，便于跟踪亲子记录提交的任务进度 */
    private void mirrorSubmission(GrowthRecord record, String status) {
        TaskSubmission submission = new TaskSubmission();
        submission.setTaskId(record.getTaskId());
        submission.setMemberId(record.getAuthorMemberId());
        submission.setNote(record.getTitle());
        submission.setMediaUrls(new ArrayList<>(record.getMediaUrls()));
        submission.setStatus(status);
        if (TaskSubmission.STATUS_APPROVED.equals(status)) {
            submission.setReviewedAt(LocalDateTime.now());
        }
        submissionRepository.save(submission);
    }

    /** 修改重新提交后：刷新看板镜像提交（无待审镜像则新建） */
    private void refreshPendingMirror(GrowthRecord record) {
        TaskSubmission pending = submissionRepository
                .findByTaskIdOrderBySubmittedAtDesc(record.getTaskId()).stream()
                .filter(s -> record.getAuthorMemberId() != null && record.getAuthorMemberId().equals(s.getMemberId()))
                .filter(s -> TaskSubmission.STATUS_PENDING.equals(s.getStatus()))
                .findFirst().orElse(null);
        if (pending == null) {
            mirrorSubmission(record, TaskSubmission.STATUS_PENDING);
            return;
        }
        pending.setNote(record.getTitle());
        pending.setMediaUrls(new ArrayList<>(record.getMediaUrls()));
        submissionRepository.save(pending);
    }

    /** 记录审核结果同步到看板镜像提交 */
    private void syncMirrorSubmissions(GrowthRecord record, boolean approve) {
        if (record.getAuthorMemberId() == null) {
            return;
        }
        submissionRepository.findByTaskIdOrderBySubmittedAtDesc(record.getTaskId()).stream()
                .filter(s -> record.getAuthorMemberId().equals(s.getMemberId()))
                .filter(s -> TaskSubmission.STATUS_PENDING.equals(s.getStatus()))
                .forEach(s -> {
                    s.setStatus(approve ? TaskSubmission.STATUS_APPROVED : TaskSubmission.STATUS_REJECTED);
                    s.setReviewedAt(LocalDateTime.now());
                    submissionRepository.save(s);
                });
    }

    private FamilyMember currentAuthor(Long familyId, List<Long> participantIds) {
        FamilyMember self = familyService.currentMemberOrEmpty().orElse(null);
        if (self != null && self.getFamilyId() != null && self.getFamilyId().equals(familyId)) {
            return self;
        }
        return participantIds == null || participantIds.isEmpty()
                ? null
                : familyService.members(familyId).stream()
                        .filter(m -> participantIds.contains(m.getId()))
                        .findFirst().orElse(null);
    }

    /** 待家长审核的亲子记录（仅家长可见，用于首页待审核窗口） */
    @Transactional(readOnly = true)
    public List<RecordDtos.RecordDto> pendingReviews(Long familyId, Long currentUserId) {
        if (familyService.isChild()) {
            return List.of();
        }
        Specification<GrowthRecord> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("familyId"), familyId),
                cb.equal(root.get("status"), GrowthRecord.STATUS_PENDING));
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        return recordRepository.findAll(spec, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream()
                .map(r -> toDto(r, members, currentUserId))
                .toList();
    }

    /** 亲子只能看到已通过的记录 + 自己提交的记录（含待审核/被退回） */
    private boolean visibleToCurrentUser(GrowthRecord record) {
        if (!familyService.isChild()) {
            return true;
        }
        if (!GrowthRecord.STATUS_PENDING.equals(record.getStatus())
                && !GrowthRecord.STATUS_REJECTED.equals(record.getStatus())) {
            return true;
        }
        FamilyMember self = familyService.currentMemberOrEmpty().orElse(null);
        return self != null && self.getId().equals(record.getAuthorMemberId());
    }

    public Long familyId() {
        return familyService.currentFamilyId();
    }

    public Long currentUserId() {
        return familyService.requireUser().getId();
    }

    public GrowthRecord requireRecord(Long id, Long familyId) {
        GrowthRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new BizException("记录不存在"));
        if (!record.getFamilyId().equals(familyId)) {
            throw new BizException("无权查看该记录");
        }
        return record;
    }

    @Transactional(readOnly = true)
    public RecordDtos.RecordDto toDto(GrowthRecord record, Map<Long, FamilyMember> members, Long currentUserId) {
        List<RecordDtos.ParticipantDto> participants = record.getParticipantIds().stream()
                .map(members::get)
                .filter(Objects::nonNull)
                .map(m -> new RecordDtos.ParticipantDto(m.getId(), m.getName(), m.getAvatar(), m.getRelation(), m.getRole()))
                .toList();

        FamilyMember author = record.getAuthorMemberId() == null ? null : members.get(record.getAuthorMemberId());
        Task task = record.getTaskId() == null ? null : taskRepository.findById(record.getTaskId()).orElse(null);
        boolean isMine = author != null && author.getUserId() != null && author.getUserId().equals(currentUserId);

        return new RecordDtos.RecordDto(
                record.getId(),
                record.getType(),
                record.getTitle(),
                record.getContent(),
                record.getCategory(),
                record.getRecordDate(),
                record.getVisibility(),
                record.getStatus() == null ? GrowthRecord.STATUS_APPROVED : record.getStatus(),
                record.getLocation(),
                record.getPoints(),
                List.copyOf(record.getMediaUrls()),
                participants,
                record.getAuthorMemberId(),
                author == null ? null : author.getName(),
                author == null ? null : author.getAvatar(),
                author == null ? null : author.getRelation(),
                record.getTaskId(),
                task == null ? null : task.getTitle(),
                task == null ? null : task.getDeadline(),
                (int) likeRepository.countByRecordId(record.getId()),
                (int) commentRepository.countByRecordId(record.getId()),
                currentUserId != null && likeRepository.findByRecordIdAndUserId(record.getId(), currentUserId).isPresent(),
                isMine,
                record.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public Map<Long, List<GrowthRecord>> recordsByFamily(Long familyId) {
        return recordRepository.findByFamilyId(familyId, PageRequest.of(0, 2000)).getContent().stream()
                .collect(Collectors.groupingBy(GrowthRecord::getFamilyId));
    }
}
