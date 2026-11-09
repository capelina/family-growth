package com.family.growth.service;

import com.family.growth.domain.Family;
import com.family.growth.domain.FamilyMember;
import com.family.growth.domain.GrowthRecord;
import com.family.growth.domain.Task;
import com.family.growth.repo.GrowthRecordRepository;
import com.family.growth.repo.TaskRepository;
import com.family.growth.web.dto.StatsDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 记录展示与可视化分析。
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private final GrowthRecordRepository recordRepository;
    private final TaskRepository taskRepository;
    private final FamilyService familyService;

    @Transactional(readOnly = true)
    public StatsDtos.StatsResp stats(int days) {
        Family family = familyService.requireFamily();
        Long familyId = family.getId();
        Long currentUserId = familyService.requireUser().getId();
        int window = Math.min(Math.max(days, 7), 180);

        List<GrowthRecord> records = recordRepository
                .findByFamilyId(familyId, PageRequest.of(0, 2000, org.springframework.data.domain.Sort
                        .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")))
                .getContent();
        List<Task> tasks = taskRepository.findByFamilyIdOrderByCreatedAtDesc(familyId);
        List<FamilyMember> members = familyService.members(familyId);

        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.from(today);
        LocalDate weekStart = today.minusDays(6);

        long monthRecords = records.stream()
                .filter(r -> r.getRecordDate() != null && YearMonth.from(r.getRecordDate()).equals(thisMonth))
                .count();
        long weekRecords = records.stream()
                .filter(r -> r.getRecordDate() != null && !r.getRecordDate().isBefore(weekStart))
                .count();
        long doneTasks = tasks.stream().filter(t -> Task.STATUS_CLOSED.equals(t.getStatus())).count();
        long pendingTasks = tasks.stream().filter(t -> Task.STATUS_OPEN.equals(t.getStatus())).count();
        int totalPoints = members.stream().mapToInt(m -> m.getPoints() == null ? 0 : m.getPoints()).sum();
        long publicRecords = records.stream()
                .filter(r -> GrowthRecord.VISIBILITY_PUBLIC.equals(r.getVisibility())).count();

        StatsDtos.OverviewDto overview = new StatsDtos.OverviewDto(
                monthRecords, weekRecords, doneTasks, pendingTasks, totalPoints,
                members.size(), publicRecords, records.size(), streakDays(records));

        // 近 N 天的记录趋势
        Map<LocalDate, Long> byDay = records.stream()
                .filter(r -> r.getCreatedAt() != null)
                .collect(Collectors.groupingBy(r -> r.getCreatedAt().toLocalDate(), Collectors.counting()));
        List<StatsDtos.TrendPoint> trend = new ArrayList<>();
        for (int i = window - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            trend.add(new StatsDtos.TrendPoint(day.toString(), byDay.getOrDefault(day, 0L)));
        }

        // 成员贡献
        Map<Long, Long> recordCounts = new LinkedHashMap<>();
        for (GrowthRecord r : records) {
            if (r.getAuthorMemberId() != null) {
                recordCounts.merge(r.getAuthorMemberId(), 1L, Long::sum);
            }
            for (Long pid : r.getParticipantIds()) {
                recordCounts.merge(pid, 1L, Long::sum);
            }
        }
        List<FamilyMember> sortedByPoints = members.stream()
                .sorted(Comparator.comparingInt((FamilyMember m) -> m.getPoints() == null ? 0 : m.getPoints()).reversed())
                .toList();
        List<StatsDtos.MemberStat> memberStats = new ArrayList<>();
        for (int i = 0; i < sortedByPoints.size(); i++) {
            FamilyMember m = sortedByPoints.get(i);
            memberStats.add(new StatsDtos.MemberStat(
                    m.getId(), m.getName(), m.getAvatar(), m.getColor(), m.getRole(), m.getRelation(),
                    recordCounts.getOrDefault(m.getId(), 0L),
                    m.getPoints() == null ? 0 : m.getPoints(),
                    i + 1));
        }

        // 分类分布
        Map<String, Long> categoryCounter = new LinkedHashMap<>();
        records.forEach(r -> categoryCounter.merge(
                r.getCategory() == null || r.getCategory().isBlank() ? "未分类" : r.getCategory(),
                1L, Long::sum));
        List<StatsDtos.CategoryStat> categories = categoryCounter.entrySet().stream()
                .map(e -> new StatsDtos.CategoryStat(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();

        return new StatsDtos.StatsResp(overview, trend, memberStats, categories);
    }

    /** 连续记录天数 */
    private int streakDays(List<GrowthRecord> records) {
        Set<LocalDate> dates = records.stream()
                .map(r -> r.getRecordDate() == null
                        ? (r.getCreatedAt() == null ? null : r.getCreatedAt().toLocalDate())
                        : r.getRecordDate())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        int streak = 0;
        LocalDate cursor = LocalDate.now();
        if (!dates.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
