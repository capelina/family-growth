package com.family.growth.service;

import com.family.growth.common.BizException;
import com.family.growth.domain.*;
import com.family.growth.repo.FamilyMemberRepository;
import com.family.growth.repo.GrowthRecordRepository;
import com.family.growth.repo.TaskRepository;
import com.family.growth.repo.TaskSubmissionRepository;
import com.family.growth.web.dto.TaskDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * 任务记录：家长发布任务 → 孩子提交凭证 → 家长审核。
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskSubmissionRepository submissionRepository;
    private final FamilyMemberRepository memberRepository;
    private final GrowthRecordRepository recordRepository;
    private final FamilyService familyService;

    @Transactional(readOnly = true)
    public List<TaskDtos.TaskDto> list(String status, Long assigneeMemberId) {
        Family family = familyService.requireFamily();
        Map<Long, FamilyMember> members = familyService.memberMap(family.getId());
        return taskRepository.findByFamilyIdOrderByCreatedAtDesc(family.getId()).stream()
                .filter(t -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)
                        || status.equalsIgnoreCase(t.getStatus()))
                .filter(t -> assigneeMemberId == null || assigneeMemberId.equals(t.getAssigneeMemberId()))
                .map(t -> toDto(t, members))
                .toList();
    }

    @Transactional
    public TaskDtos.TaskDto create(TaskDtos.TaskReq req) {
        familyService.requireParent();
        Family family = familyService.requireFamily();
        Task task = new Task();
        task.setFamilyId(family.getId());
        apply(task, req);
        FamilyMember creator = familyService.currentMemberOrEmpty().orElse(null);
        task.setCreatedByMemberId(creator == null ? null : creator.getId());
        taskRepository.save(task);
        return toDto(task, familyService.memberMap(family.getId()));
    }

    @Transactional
    public TaskDtos.TaskDto update(Long id, TaskDtos.TaskReq req) {
        familyService.requireParent();
        Long familyId = familyService.currentFamilyId();
        Task task = requireTask(id, familyId);
        apply(task, req);
        taskRepository.save(task);
        return toDto(task, familyService.memberMap(familyId));
    }

    @Transactional
    public void delete(Long id) {
        familyService.requireParent();
        Long familyId = familyService.currentFamilyId();
        Task task = requireTask(id, familyId);
        submissionRepository.deleteByTaskId(task.getId());
        List<GrowthRecord> linked = recordRepository.findByTaskId(task.getId());
        linked.forEach(recordRepository::delete);
        taskRepository.delete(task);
    }

    @Transactional
    public TaskDtos.SubmissionDto submit(Long taskId, TaskDtos.SubmitReq req) {
        Family family = familyService.requireFamily();
        Task task = requireTask(taskId, family.getId());
        if (Task.STATUS_CLOSED.equals(task.getStatus())) {
            throw new BizException("该任务已结束，无法提交");
        }
        if (Task.SUBMIT_RECORD.equals(task.getSubmitMode())) {
            throw new BizException("该任务需提交亲子记录完成，请在任务详情中点击「提交亲子记录」");
        }
        if (Task.MODE_DURATION.equals(task.getTaskMode())) {
            if (task.getStartedAt() == null) {
                throw new BizException("请先点击「开始」，计时后再提交");
            }
            if (task.getExpiresAt() != null && LocalDateTime.now().isAfter(task.getExpiresAt())) {
                task.setStatus(Task.STATUS_CLOSED);
                taskRepository.save(task);
                throw new BizException("限时已结束，任务超时未完成");
            }
        }
        boolean hasMedia = req.mediaUrls() != null
                && req.mediaUrls().stream().anyMatch(u -> u != null && !u.isBlank());
        if (Boolean.TRUE.equals(task.getRequireProof()) && !hasMedia) {
            throw new BizException("该任务需要上传任务期间的照片或视频凭证");
        }
        Long memberId;
        if (familyService.isChild()) {
            // 亲子成员只能以自己的身份提交，不能替他人提交
            memberId = familyService.currentMember().getId();
        } else {
            memberId = req.memberId() != null ? req.memberId()
                    : familyService.members(family.getId()).stream()
                            .filter(m -> FamilyMember.ROLE_CHILD.equals(m.getRole()))
                            .map(FamilyMember::getId).findFirst()
                            .orElseThrow(() -> new BizException("请先添加孩子成员"));
        }
        FamilyMember member = familyService.requireMember(memberId, family.getId());

        TaskSubmission submission = new TaskSubmission();
        submission.setTaskId(task.getId());
        submission.setMemberId(member.getId());
        submission.setNote(req.note());
        submission.setMediaUrls(req.mediaUrls() == null ? new ArrayList<>() : new ArrayList<>(req.mediaUrls()));
        submission.setStatus(TaskSubmission.STATUS_PENDING);
        submissionRepository.save(submission);
        return toSubmissionDto(submission, member);
    }

    @Transactional
    public TaskDtos.TaskDto review(Long taskId, TaskDtos.ReviewReq req) {
        familyService.requireParent();
        Family family = familyService.requireFamily();
        Task task = requireTask(taskId, family.getId());
        if (Task.SUBMIT_RECORD.equals(task.getSubmitMode())) {
            throw new BizException("该任务通过亲子记录提交，请在首页「待审核」或亲子记录中审核");
        }
        TaskSubmission submission = submissionRepository.findById(req.submissionId())
                .orElseThrow(() -> new BizException("提交记录不存在"));
        if (!submission.getTaskId().equals(task.getId())) {
            throw new BizException("提交记录与任务不匹配");
        }
        FamilyMember member = familyService.requireMember(submission.getMemberId(), family.getId());

        boolean approve = req.approve() == null || req.approve();
        submission.setStatus(approve ? TaskSubmission.STATUS_APPROVED : TaskSubmission.STATUS_REJECTED);
        submission.setReviewComment(req.comment());
        submission.setReviewedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        if (approve) {
            // 奖励积分
            int points = task.getPoints() == null ? 0 : task.getPoints();
            member.setPoints((member.getPoints() == null ? 0 : member.getPoints()) + points);
            memberRepository.save(member);

            // 生成一条「任务记录」
            GrowthRecord record = new GrowthRecord();
            record.setFamilyId(family.getId());
            record.setType(GrowthRecord.TYPE_TASK);
            record.setTaskId(task.getId());
            record.setAuthorMemberId(member.getId());
            record.setTitle(task.getTitle() + " · 完成啦");
            record.setContent(submission.getNote());
            record.setCategory(task.getCategory() == null ? "任务" : task.getCategory());
            record.setRecordDate(LocalDate.now());
            record.setVisibility(GrowthRecord.VISIBILITY_PRIVATE);
            record.setPoints(points);
            record.setMediaUrls(new ArrayList<>(submission.getMediaUrls()));
            record.setParticipantIds(new ArrayList<>(List.of(member.getId())));
            recordRepository.save(record);

            task.setStatus(Task.STATUS_CLOSED);
            taskRepository.save(task);
        }
        return toDto(task, familyService.memberMap(family.getId()));
    }

    @Transactional(readOnly = true)
    public List<TaskDtos.SubmissionDto> submissions(Long taskId) {
        Long familyId = familyService.currentFamilyId();
        requireTask(taskId, familyId);
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        return submissionRepository.findByTaskIdOrderBySubmittedAtDesc(taskId).stream()
                .map(s -> toSubmissionDto(s, members.get(s.getMemberId())))
                .toList();
    }

    /** 当前家庭待审核的提交 */
    @Transactional(readOnly = true)
    public List<TaskDtos.SubmissionDto> pendingSubmissions() {
        Long familyId = familyService.currentFamilyId();
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        List<Long> taskIds = taskRepository.findByFamilyIdOrderByCreatedAtDesc(familyId).stream()
                .map(Task::getId).toList();
        if (taskIds.isEmpty()) {
            return List.of();
        }
        return submissionRepository.findByTaskIdIn(taskIds).stream()
                .filter(s -> TaskSubmission.STATUS_PENDING.equals(s.getStatus()))
                .sorted(Comparator.comparing(TaskSubmission::getSubmittedAt).reversed())
                .map(s -> toSubmissionDto(s, members.get(s.getMemberId())))
                .toList();
    }

    /** 限时任务：孩子点击「开始」启动倒计时 */
    @Transactional
    public TaskDtos.TaskDto start(Long taskId) {
        Family family = familyService.requireFamily();
        Task task = requireTask(taskId, family.getId());
        if (!Task.MODE_DURATION.equals(task.getTaskMode())) {
            throw new BizException("该任务不是限时任务，无需开始计时");
        }
        if (Task.STATUS_CLOSED.equals(task.getStatus())) {
            throw new BizException("该任务已结束");
        }
        if (task.getStartedAt() != null) {
            throw new BizException("任务已在计时中");
        }
        Long memberId;
        if (familyService.isChild()) {
            memberId = familyService.currentMember().getId();
        } else if (task.getAssigneeMemberId() != null) {
            memberId = task.getAssigneeMemberId();
        } else {
            memberId = familyService.members(family.getId()).stream()
                    .filter(m -> FamilyMember.ROLE_CHILD.equals(m.getRole()))
                    .map(FamilyMember::getId).findFirst()
                    .orElseThrow(() -> new BizException("请先添加孩子成员"));
        }
        LocalDateTime now = LocalDateTime.now();
        task.setStartedByMemberId(memberId);
        task.setStartedAt(now);
        task.setExpiresAt(now.plusMinutes(task.getDurationMinutes() == null ? 0 : task.getDurationMinutes()));
        task.setStatus(Task.STATUS_IN_PROGRESS);
        taskRepository.save(task);
        return toDto(task, familyService.memberMap(family.getId()));
    }

    private void apply(Task task, TaskDtos.TaskReq req) {
        task.setTitle(req.title().trim());
        task.setDescription(req.description());
        String mode = Task.MODE_DURATION.equalsIgnoreCase(req.taskMode() == null ? "" : req.taskMode().trim())
                ? Task.MODE_DURATION : Task.MODE_DEADLINE;
        task.setTaskMode(mode);
        // 模式或时间设置变化时，重置计时状态
        task.setStartedByMemberId(null);
        task.setStartedAt(null);
        task.setExpiresAt(null);
        if (Task.MODE_DURATION.equals(mode)) {
            if (req.durationMinutes() == null || req.durationMinutes() <= 0) {
                throw new BizException("请设置限时时长");
            }
            task.setDurationMinutes(req.durationMinutes());
            task.setDeadline(null);
        } else {
            task.setDeadline(req.deadline());
            task.setDurationMinutes(null);
        }
        task.setRequireProof(Boolean.TRUE.equals(req.requireProof()));
        task.setSubmitMode(Task.SUBMIT_RECORD.equalsIgnoreCase(req.submitMode() == null ? "" : req.submitMode().trim())
                ? Task.SUBMIT_RECORD : Task.SUBMIT_PROOF);
        task.setPoints(req.points() == null ? 10 : req.points());
        task.setAssigneeMemberId(req.assigneeMemberId());
        task.setCategory(req.category() == null || req.category().isBlank() ? "习惯养成" : req.category());
        if (task.getStatus() == null || Task.STATUS_IN_PROGRESS.equals(task.getStatus())) {
            task.setStatus(Task.STATUS_OPEN);
        }
    }

    public Task requireTask(Long id, Long familyId) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new BizException("任务不存在"));
        if (!task.getFamilyId().equals(familyId)) {
            throw new BizException("无权操作该任务");
        }
        return task;
    }

    private TaskDtos.TaskDto toDto(Task task, Map<Long, FamilyMember> members) {
        FamilyMember assignee = task.getAssigneeMemberId() == null ? null : members.get(task.getAssigneeMemberId());
        List<TaskDtos.SubmissionDto> submissions = submissionRepository
                .findByTaskIdOrderBySubmittedAtDesc(task.getId()).stream()
                .map(s -> toSubmissionDto(s, members.get(s.getMemberId())))
                .toList();
        String latestStatus = submissions.isEmpty() ? null : submissions.get(0).status();
        return new TaskDtos.TaskDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getTaskMode() == null ? Task.MODE_DEADLINE : task.getTaskMode(),
                task.getDeadline(),
                task.getDurationMinutes(),
                Boolean.TRUE.equals(task.getRequireProof()),
                Task.SUBMIT_RECORD.equals(task.getSubmitMode()) ? Task.SUBMIT_RECORD : Task.SUBMIT_PROOF,
                task.getPoints(),
                task.getCategory(),
                task.getStatus(),
                task.getAssigneeMemberId(),
                assignee == null ? null : assignee.getName(),
                assignee == null ? null : assignee.getAvatar(),
                task.getStartedByMemberId(),
                task.getStartedAt(),
                task.getExpiresAt(),
                task.getCreatedAt(),
                submissions.size(),
                latestStatus,
                submissions);
    }

    private TaskDtos.SubmissionDto toSubmissionDto(TaskSubmission s, FamilyMember member) {
        return new TaskDtos.SubmissionDto(
                s.getId(),
                s.getTaskId(),
                s.getMemberId(),
                member == null ? null : member.getName(),
                member == null ? null : member.getAvatar(),
                s.getNote(),
                List.copyOf(s.getMediaUrls()),
                s.getStatus(),
                s.getReviewComment(),
                s.getSubmittedAt(),
                s.getReviewedAt());
    }

    @Transactional(readOnly = true)
    public long doneTaskCount(Long familyId) {
        return taskRepository.findByFamilyIdAndStatusOrderByDeadlineAsc(familyId, Task.STATUS_CLOSED).size();
    }

    @Transactional(readOnly = true)
    public Optional<TaskDtos.TaskDto> latestForMember(Long familyId, Long memberId) {
        Map<Long, FamilyMember> members = familyService.memberMap(familyId);
        return taskRepository.findByFamilyIdOrderByCreatedAtDesc(familyId).stream()
                .filter(t -> Objects.equals(t.getAssigneeMemberId(), memberId))
                .findFirst().map(t -> toDto(t, members));
    }
}
