package com.family.growth.service;

import com.family.growth.auth.AuthContext;
import com.family.growth.common.BizException;
import com.family.growth.domain.*;
import com.family.growth.repo.FamilyMemberRepository;
import com.family.growth.repo.FamilyRepository;
import com.family.growth.repo.GrowthRecordRepository;
import com.family.growth.repo.PlazaCommentRepository;
import com.family.growth.repo.PlazaLikeRepository;
import com.family.growth.repo.UserRepository;
import com.family.growth.web.dto.PlazaDtos;
import com.family.growth.web.dto.RecordDtos;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 家庭互动广场：聚合所有家庭公开动态，支持点赞与评论。
 */
@Service
@RequiredArgsConstructor
public class PlazaService {

    private final GrowthRecordRepository recordRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final PlazaLikeRepository likeRepository;
    private final PlazaCommentRepository commentRepository;
    private final FamilyService familyService;

    @Transactional(readOnly = true)
    public RecordDtos.PageResp<PlazaDtos.FeedItemDto> feed(String category, int page, int size) {
        Long userId = AuthContext.require();
        User me = familyService.requireUser();
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), 40);

        Specification<GrowthRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("visibility"), GrowthRecord.VISIBILITY_PUBLIC));
            predicates.add(cb.or(cb.isNull(root.get("status")),
                    cb.equal(root.get("status"), GrowthRecord.STATUS_APPROVED)));
            if (category != null && !category.isBlank() && !"全部".equals(category) && !"ALL".equalsIgnoreCase(category)) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<GrowthRecord> result = recordRepository.findAll(spec,
                PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<GrowthRecord> records = result.getContent();
        List<Long> recordIds = records.stream().map(GrowthRecord::getId).toList();
        Set<Long> likedIds = recordIds.isEmpty() ? Set.of()
                : likeRepository.findByUserIdAndRecordIdIn(userId, recordIds).stream()
                        .map(PlazaLike::getRecordId).collect(Collectors.toSet());

        Set<Long> memberIds = records.stream().map(GrowthRecord::getAuthorMemberId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, FamilyMember> memberMap = memberIds.isEmpty() ? Map.of()
                : memberRepository.findByIdIn(new ArrayList<>(memberIds)).stream()
                        .collect(Collectors.toMap(FamilyMember::getId, Function.identity(), (a, b) -> a));

        Set<Long> familyIds = records.stream().map(GrowthRecord::getFamilyId).collect(Collectors.toSet());
        Map<Long, Family> familyMap = familyIds.isEmpty() ? Map.of()
                : familyRepository.findAllById(familyIds).stream()
                        .collect(Collectors.toMap(Family::getId, Function.identity(), (a, b) -> a));

        List<PlazaDtos.FeedItemDto> items = records.stream()
                .map(r -> toFeedItem(r, memberMap, familyMap, userId, me.getFamilyId(), likedIds))
                .toList();
        return new RecordDtos.PageResp<>(items, result.getTotalElements(), p, s, result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<RecordDtos.CategoryStat> categories() {
        Map<String, Long> counter = new java.util.LinkedHashMap<>();
        recordRepository.findByVisibility(GrowthRecord.VISIBILITY_PUBLIC, PageRequest.of(0, 1000))
                .getContent().stream()
                .filter(r -> r.getStatus() == null || GrowthRecord.STATUS_APPROVED.equals(r.getStatus()))
                .forEach(r -> counter.merge(
                        r.getCategory() == null || r.getCategory().isBlank() ? "未分类" : r.getCategory(),
                        1L, Long::sum));
        return counter.entrySet().stream()
                .map(e -> new RecordDtos.CategoryStat(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();
    }

    @Transactional
    public PlazaDtos.LikeResp toggleLike(Long recordId) {
        Long userId = AuthContext.require();
        GrowthRecord record = requirePublicRecord(recordId);
        var existing = likeRepository.findByRecordIdAndUserId(recordId, userId);
        boolean liked;
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            liked = false;
        } else {
            PlazaLike like = new PlazaLike();
            like.setRecordId(recordId);
            like.setUserId(userId);
            likeRepository.save(like);
            liked = true;
        }
        return new PlazaDtos.LikeResp(liked, likeRepository.countByRecordId(record.getId()));
    }

    @Transactional(readOnly = true)
    public List<PlazaDtos.CommentDto> comments(Long recordId) {
        requirePublicRecord(recordId);
        return toCommentDtos(commentRepository.findByRecordIdOrderByCreatedAtAsc(recordId));
    }

    @Transactional
    public List<PlazaDtos.CommentDto> addComment(Long recordId, String content) {
        Long userId = AuthContext.require();
        requirePublicRecord(recordId);
        PlazaComment comment = new PlazaComment();
        comment.setRecordId(recordId);
        comment.setUserId(userId);
        comment.setContent(content.trim());
        commentRepository.save(comment);
        return toCommentDtos(commentRepository.findByRecordIdOrderByCreatedAtAsc(recordId));
    }

    private GrowthRecord requirePublicRecord(Long recordId) {
        GrowthRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BizException("动态不存在"));
        if (!GrowthRecord.VISIBILITY_PUBLIC.equals(record.getVisibility())) {
            throw new BizException("该动态未公开");
        }
        if (record.getStatus() != null && !GrowthRecord.STATUS_APPROVED.equals(record.getStatus())) {
            throw new BizException("该动态未公开");
        }
        return record;
    }

    private List<PlazaDtos.CommentDto> toCommentDtos(List<PlazaComment> comments) {
        if (comments.isEmpty()) {
            return List.of();
        }
        Set<Long> userIds = comments.stream().map(PlazaComment::getUserId).collect(Collectors.toSet());
        Map<Long, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));
        return comments.stream().map(c -> {
            User u = users.get(c.getUserId());
            return new PlazaDtos.CommentDto(c.getId(), c.getUserId(),
                    u == null ? "家人" : (u.getNickname() == null ? u.getUsername() : u.getNickname()),
                    u == null ? null : u.getAvatar(), c.getContent(), c.getCreatedAt());
        }).toList();
    }

    private PlazaDtos.FeedItemDto toFeedItem(GrowthRecord record, Map<Long, FamilyMember> memberMap,
                                             Map<Long, Family> familyMap, Long userId, Long myFamilyId,
                                             Set<Long> likedIds) {
        FamilyMember author = record.getAuthorMemberId() == null ? null : memberMap.get(record.getAuthorMemberId());
        Family family = familyMap.get(record.getFamilyId());
        List<PlazaDtos.CommentDto> comments = toCommentDtos(
                commentRepository.findByRecordIdOrderByCreatedAtAsc(record.getId()));
        return new PlazaDtos.FeedItemDto(
                record.getId(),
                record.getTitle(),
                record.getContent(),
                record.getCategory(),
                record.getRecordDate(),
                List.copyOf(record.getMediaUrls()),
                record.getFamilyId(),
                family == null ? "一个家庭" : family.getName(),
                family == null ? null : family.getCover(),
                author == null ? "家人" : author.getName(),
                author == null ? null : author.getAvatar(),
                author == null ? null : author.getRelation(),
                (int) likeRepository.countByRecordId(record.getId()),
                comments.size(),
                likedIds.contains(record.getId()),
                Objects.equals(record.getFamilyId(), myFamilyId),
                comments.stream().limit(2).toList(),
                record.getCreatedAt());
    }
}
