package com.family.growth.bootstrap;

import com.family.growth.domain.*;
import com.family.growth.repo.*;
import com.family.growth.service.FamilyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 首次启动时写入演示数据，让应用打开就能看到真实内容。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository memberRepository;
    private final GrowthRecordRepository recordRepository;
    private final TaskRepository taskRepository;
    private final TaskSubmissionRepository submissionRepository;
    private final GrowthMeasurementRepository measurementRepository;
    private final MilestoneRepository milestoneRepository;
    private final SkillRepository skillRepository;
    private final PlazaCommentRepository commentRepository;
    private final PlazaLikeRepository likeRepository;
    private final FamilyService familyService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        log.info("首次启动，正在写入演示数据…");

        // ---------- 家庭一：陈家小院 ----------
        User mom = user("demo", "123456", "涵涵妈妈", avatar("portrait photo of a friendly Chinese mother in her thirties, soft natural window light, warm beige background, smiling, professional headshot"));
        Family chenFamily = familyService.createFamily(mom.getId(), "陈家小院");
        chenFamily.setMotto("慢慢来，一起长大");
        chenFamily.setCover(img("a warm sunlit living room with wooden floor, houseplants and soft morning light, cozy family home interior, photorealistic", "landscape_4_3"));
        familyRepository.save(chenFamily);
        mom.setFamilyId(chenFamily.getId());
        userRepository.save(mom);

        FamilyMember momM = member(chenFamily.getId(), mom.getId(), "涵涵妈妈", FamilyMember.ROLE_PARENT, "妈妈", "#F4573B",
                avatar("portrait photo of a friendly Chinese mother in her thirties, soft natural light, warm background"));
        FamilyMember dadM = member(chenFamily.getId(), null, "陈爸爸", FamilyMember.ROLE_PARENT, "爸爸", "#5B8DEF",
                avatar("portrait photo of a calm Chinese father in his thirties, soft natural light, warm background"));
        FamilyMember hanhan = member(chenFamily.getId(), null, "涵涵", FamilyMember.ROLE_CHILD, "女儿", "#E8A33D",
                avatar("portrait photo of a happy 8 year old Chinese girl with shoulder length hair, soft natural light, warm background"));
        hanhan.setBirthday(LocalDate.of(2018, 5, 12));
        hanhan.setPoints(320);
        FamilyMember guoguo = member(chenFamily.getId(), null, "果果", FamilyMember.ROLE_CHILD, "儿子", "#2E9E8F",
                avatar("portrait photo of a cheerful 5 year old Chinese boy, short hair, soft natural light, warm background"));
        guoguo.setBirthday(LocalDate.of(2021, 9, 3));
        guoguo.setPoints(180);
        memberRepository.saveAll(List.of(momM, dadM, hanhan, guoguo));

        // ---------- 家庭二：李家小屋（用于广场展示） ----------
        User leleMom = user("lile", "123456", "乐乐妈妈", avatar("portrait photo of a warm Chinese mother in her thirties, minimal grey background, soft light"));
        Family liFamily = familyService.createFamily(leleMom.getId(), "李家小屋");
        liFamily.setMotto("把日子过成故事");
        familyRepository.save(liFamily);
        leleMom.setFamilyId(liFamily.getId());
        userRepository.save(leleMom);

        FamilyMember leleMomM = member(liFamily.getId(), leleMom.getId(), "乐乐妈妈", FamilyMember.ROLE_PARENT, "妈妈", "#A768D6",
                leleMom.getAvatar());
        FamilyMember lele = member(liFamily.getId(), null, "乐乐", FamilyMember.ROLE_CHILD, "女儿", "#3FA06A",
                avatar("portrait photo of a smiling 6 year old Chinese girl wearing a yellow sweater, soft natural light"));
        lele.setBirthday(LocalDate.of(2019, 3, 8));
        lele.setPoints(240);
        memberRepository.saveAll(List.of(leleMomM, lele));

        // ---------- 亲子记录（陈家） ----------
        LocalDate today = LocalDate.now();
        record(chenFamily.getId(), momM.getId(), GrowthRecord.TYPE_FREE, "周末郊野徒步", "自然",
                "沿着河边走了两个小时，涵涵一路捡了 12 片不同形状的叶子，果果追着蝴蝶跑得满头大汗。",
                img("a Chinese mother walking with her two young children on a riverside trail in autumn, golden sunlight, trees, candid documentary photo", "landscape_4_3"),
                today.minusDays(3), GrowthRecord.VISIBILITY_PUBLIC, "青龙湖绿道", List.of(momM.getId(), hanhan.getId(), guoguo.getId()), 0);
        record(chenFamily.getId(), momM.getId(), GrowthRecord.TYPE_FREE, "创意绘画课程", "艺术",
                "今天的主题是「我心中的家」，涵涵画了一栋有大烟囱的房子，说烟囱里会冒出棉花糖。",
                img("a young Chinese girl proudly showing her crayon drawing of a colorful house, art class table with paint brushes, bright natural light", "landscape_4_3"),
                today.minusDays(6), GrowthRecord.VISIBILITY_PUBLIC, "社区活动中心", List.of(momM.getId(), hanhan.getId()), 0);
        record(chenFamily.getId(), momM.getId(), GrowthRecord.TYPE_FREE, "家庭晚餐时光", "家庭",
                "一起包了饺子，果果包了三个「小元宝」，说要留给加班回家的爸爸。",
                img("a Chinese family having dinner together at home, dumplings on the table, warm cozy evening light, candid photo", "landscape_4_3"),
                today.minusDays(9), GrowthRecord.VISIBILITY_PRIVATE, "家", List.of(momM.getId(), dadM.getId(), hanhan.getId(), guoguo.getId()), 0);
        record(chenFamily.getId(), dadM.getId(), GrowthRecord.TYPE_FREE, "涵涵第一次骑自行车", "运动",
                "练习了整整一个月，今天终于可以自己骑出小区门口了，回来的时候兴奋得脸都红了。",
                img("a young Chinese girl riding a small bicycle without training wheels on a neighborhood path, father watching nearby, sunny afternoon", "landscape_4_3"),
                today.minusDays(36), GrowthRecord.VISIBILITY_PUBLIC, "小区中庭", List.of(dadM.getId(), hanhan.getId()), 0);
        record(chenFamily.getId(), momM.getId(), GrowthRecord.TYPE_FREE, "亲子阅读《夏洛的网》", "阅读",
                "读到夏洛为了朋友织出「了不起」三个字的时候，涵涵安静了很久，然后说想给夏洛写封信。",
                null, today.minusDays(29), GrowthRecord.VISIBILITY_PUBLIC, "客厅沙发", List.of(momM.getId(), hanhan.getId()), 0);
        record(chenFamily.getId(), momM.getId(), GrowthRecord.TYPE_FREE, "果果学会自己穿鞋", "生活",
                "左右脚终于没有穿反，虽然鞋带还系不好，但已经坚持三天自己完成了。",
                null, today.minusDays(24), GrowthRecord.VISIBILITY_PRIVATE, "玄关", List.of(guoguo.getId()), 0);
        record(chenFamily.getId(), momM.getId(), GrowthRecord.TYPE_FREE, "一起做曲奇", "家庭",
                "厨房像被面粉轰炸过，但曲奇的形状很有想象力，有恐龙、有星星，还有一颗爱心。",
                img("a mother and her young daughter baking cookies together in a bright kitchen, flour on the counter, laughing, candid warm photo", "landscape_4_3"),
                today.minusDays(32), GrowthRecord.VISIBILITY_PUBLIC, "家", List.of(momM.getId(), hanhan.getId()), 0);
        record(chenFamily.getId(), dadM.getId(), GrowthRecord.TYPE_FREE, "校园运动会", "运动",
                "涵涵参加了 50 米跑和跳远，虽然没拿到名次，但冲过终点的时候笑得特别开心。",
                img("an elementary school sports day in China, children running on a red track, colorful flags, cheering crowd, sunny day", "landscape_4_3"),
                today.minusDays(15), GrowthRecord.VISIBILITY_PRIVATE, "实验小学", List.of(dadM.getId(), hanhan.getId()), 0);

        // ---------- 亲子记录（李家，公开到广场） ----------
        record(liFamily.getId(), leleMomM.getId(), GrowthRecord.TYPE_FREE, "乐乐的第一幅水彩画", "艺术",
                "第一次用水彩，画了一片傍晚的天空，她说云是被夕阳烧红的棉花糖。",
                img("a young Chinese girl holding up a watercolor painting of a sunset sky, art studio, soft daylight", "landscape_4_3"),
                today.minusDays(2), GrowthRecord.VISIBILITY_PUBLIC, "画室", List.of(leleMomM.getId(), lele.getId()), 0);
        record(liFamily.getId(), leleMomM.getId(), GrowthRecord.TYPE_FREE, "全家骑行绿道", "户外",
                "租了三辆车，沿着江边骑了 8 公里，乐乐全程自己骑，只在最后一段上坡求了救。",
                img("a family cycling together on a riverside greenway in China, autumn leaves, tandem and small bikes, wide landscape photo", "landscape_4_3"),
                today.minusDays(7), GrowthRecord.VISIBILITY_PUBLIC, "滨江绿道", List.of(leleMomM.getId(), lele.getId()), 0);
        record(liFamily.getId(), leleMomM.getId(), GrowthRecord.TYPE_FREE, "睡前故事时间", "阅读",
                "最近在讲《不一样的卡梅拉》，每天都要讨价还价多听一章。",
                null, today.minusDays(11), GrowthRecord.VISIBILITY_PUBLIC, "家", List.of(leleMomM.getId(), lele.getId()), 0);

        // 广场互动
        var plazaTarget = recordRepository.findByVisibility(GrowthRecord.VISIBILITY_PUBLIC,
                org.springframework.data.domain.PageRequest.of(0, 1)).getContent();
        if (!plazaTarget.isEmpty()) {
            Long rid = plazaTarget.get(0).getId();
            PlazaComment c1 = new PlazaComment();
            c1.setRecordId(rid);
            c1.setUserId(leleMom.getId());
            c1.setContent("这样的周末太治愈了，我们也想安排一次！");
            PlazaComment c2 = new PlazaComment();
            c2.setRecordId(rid);
            c2.setUserId(mom.getId());
            c2.setContent("走起来，叶子季节正好。");
            commentRepository.saveAll(List.of(c1, c2));
            PlazaLike like = new PlazaLike();
            like.setRecordId(rid);
            like.setUserId(leleMom.getId());
            like.setCreatedAt(LocalDateTime.now().minusHours(3));
            likeRepository.save(like);
        }

        // ---------- 任务 ----------
        Task t1 = task(chenFamily.getId(), hanhan.getId(), momM.getId(), "每天练琴 20 分钟", "习惯养成", 20,
                "练习《小星星变奏曲》，练完在练琴本上打勾。", today.minusDays(10));
        Task t2 = task(chenFamily.getId(), hanhan.getId(), momM.getId(), "整理自己的书桌", "生活自理", 15,
                "把书按大小排好，铅笔削好放进笔筒。", today.minusDays(20));
        Task t3 = task(chenFamily.getId(), guoguo.getId(), momM.getId(), "周末帮妈妈浇花", "家务", 10,
                "阳台上的六盆花都要浇到，注意不要浇太多。", today.plusDays(4));
        Task t4 = task(chenFamily.getId(), hanhan.getId(), momM.getId(), "独立阅读 10 页", "学习", 25,
                "自己读完《夏洛的网》第十章，可以用自己的话讲给妈妈听。", today.plusDays(6));

        // 已通过 / 待审核的提交
        submissionRepository.save(buildSubmission(t1, hanhan.getId(), "今天练了 25 分钟，手上有点酸。",
                img("a young Chinese girl practicing piano at home, sheet music on the stand, warm indoor light, candid photo", "landscape_4_3"),
                TaskSubmission.STATUS_APPROVED, "很棒，坚持就是最厉害的天赋。", LocalDateTime.now().minusDays(2)));
        submissionRepository.save(buildSubmission(t2, hanhan.getId(), "书桌收拾好啦，还擦了桌面。",
                img("a neatly organized child desk with books stacked by size and a pencil holder, soft daylight, clean simple composition", "landscape_4_3"),
                TaskSubmission.STATUS_APPROVED, "整理得很整齐，妈妈给你点个赞。", LocalDateTime.now().minusDays(18)));
        submissionRepository.save(buildSubmission(t4, hanhan.getId(), "读完了第十章，夏洛真的很聪明。",
                img("a young Chinese girl reading a book on a sofa at home, warm afternoon light, cozy living room", "landscape_4_3"),
                TaskSubmission.STATUS_PENDING, null, LocalDateTime.now().minusHours(5)));

        // 任务完成后生成的记录
        record(chenFamily.getId(), hanhan.getId(), GrowthRecord.TYPE_TASK, "每天练琴 20 分钟 · 完成啦", "任务",
                "今天练了 25 分钟，手上有点酸。",
                img("a young Chinese girl practicing piano at home, sheet music on the stand, warm indoor light", "landscape_4_3"),
                today.minusDays(2), GrowthRecord.VISIBILITY_PRIVATE, null, List.of(hanhan.getId()), 20);
        record(chenFamily.getId(), hanhan.getId(), GrowthRecord.TYPE_TASK, "整理自己的书桌 · 完成啦", "任务",
                "书桌收拾好啦，还擦了桌面。",
                img("a neatly organized child desk with books stacked by size and a pencil holder, soft daylight", "landscape_4_3"),
                today.minusDays(18), GrowthRecord.VISIBILITY_PRIVATE, null, List.of(hanhan.getId()), 15);

        // ---------- 成长档案 ----------
        measure(hanhan.getId(), LocalDate.of(2023, 5, 12), 115.0, 20.5, "幼儿园体检");
        measure(hanhan.getId(), LocalDate.of(2024, 5, 12), 123.0, 25.0, null);
        measure(hanhan.getId(), LocalDate.of(2025, 5, 12), 131.0, 29.5, "换牙期");
        measure(hanhan.getId(), LocalDate.of(2026, 5, 12), 138.5, 33.2, "小学二年级体检");
        measure(guoguo.getId(), LocalDate.of(2023, 9, 3), 88.0, 12.5, null);
        measure(guoguo.getId(), LocalDate.of(2024, 9, 3), 98.0, 15.0, null);
        measure(guoguo.getId(), LocalDate.of(2025, 9, 3), 107.5, 17.8, null);
        measure(guoguo.getId(), LocalDate.of(2026, 9, 3), 114.0, 20.4, "幼儿园体检");

        milestone(hanhan.getId(), "学会骑自行车", LocalDate.of(2026, 9, 5), "第一次独立骑出小区门口", "bike");
        milestone(hanhan.getId(), "第一次登台表演", LocalDate.of(2026, 6, 1), "儿童节汇演，弹了《小星星》", "music");
        milestone(hanhan.getId(), "独立读完一本书", LocalDate.of(2026, 5, 20), "《夏洛的网》全本", "book");
        milestone(hanhan.getId(), "学会游泳", LocalDate.of(2025, 8, 15), "可以自己游 25 米", "swim");
        milestone(guoguo.getId(), "学会自己穿鞋", LocalDate.of(2026, 9, 20), "左右脚不再穿反", "shoe");
        milestone(guoguo.getId(), "戒掉安抚奶嘴", LocalDate.of(2026, 4, 2), "自己主动把奶嘴送给了小表弟", "heart");

        skill(hanhan.getId(), "钢琴", "艺术", 3, "能完整弹奏《小星星变奏曲》");
        skill(hanhan.getId(), "绘画", "艺术", 4, "喜欢画房子和天空");
        skill(hanhan.getId(), "跳绳", "运动", 4, "一分钟 120 个");
        skill(hanhan.getId(), "阅读", "学习", 4, "可以独立读章节书");
        skill(hanhan.getId(), "整理房间", "生活", 3, "自己收拾书桌和玩具");
        skill(guoguo.getId(), "自己吃饭", "生活", 4, "基本不洒出来");
        skill(guoguo.getId(), "拼图", "学习", 3, "能完成 60 片拼图");
        skill(guoguo.getId(), "拍球", "运动", 2, "连续拍 20 个");

        log.info("演示数据写入完成：demo / 123456 可登录体验");
    }

    // ---------------- 辅助方法 ----------------

    private User user(String username, String password, String nickname, String avatar) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(encoder.encode(password));
        u.setNickname(nickname);
        u.setAvatar(avatar);
        return userRepository.save(u);
    }

    private FamilyMember member(Long familyId, Long userId, String name, String role, String relation,
                                String color, String avatar) {
        FamilyMember m = new FamilyMember();
        m.setFamilyId(familyId);
        m.setUserId(userId);
        m.setName(name);
        m.setRole(role);
        m.setRelation(relation);
        m.setColor(color);
        m.setAvatar(avatar);
        m.setPoints(0);
        return m;
    }

    private void record(Long familyId, Long authorMemberId, String type, String title,
                        String category, String content, String media, LocalDate date, String visibility,
                        String location, List<Long> participants, int points) {
        GrowthRecord r = new GrowthRecord();
        r.setFamilyId(familyId);
        r.setType(type);
        r.setAuthorMemberId(authorMemberId);
        r.setTitle(title);
        r.setCategory(category);
        r.setContent(content);
        r.setRecordDate(date);
        r.setVisibility(visibility);
        r.setLocation(location);
        r.setPoints(points);
        r.setCreatedAt(date.atTime(19, 30));
        r.setMediaUrls(media == null ? new ArrayList<>() : new ArrayList<>(List.of(media)));
        r.setParticipantIds(new ArrayList<>(participants));
        recordRepository.save(r);
    }

    private Task task(Long familyId, Long assignee, Long creator, String title, String category, int points,
                      String description, LocalDate deadline) {
        Task t = new Task();
        t.setFamilyId(familyId);
        t.setAssigneeMemberId(assignee);
        t.setCreatedByMemberId(creator);
        t.setTitle(title);
        t.setCategory(category);
        t.setPoints(points);
        t.setDescription(description);
        t.setTaskMode(Task.MODE_DEADLINE);
        t.setDeadline(deadline == null ? null : deadline.atTime(23, 59));
        t.setStatus(deadline != null && deadline.isBefore(LocalDate.now()) ? Task.STATUS_CLOSED : Task.STATUS_OPEN);
        t.setCreatedAt(LocalDateTime.now().minusDays(12));
        return taskRepository.save(t);
    }

    private TaskSubmission buildSubmission(Task task, Long memberId, String note, String media, String status,
                                           String comment, LocalDateTime submittedAt) {
        TaskSubmission s = new TaskSubmission();
        s.setTaskId(task.getId());
        s.setMemberId(memberId);
        s.setNote(note);
        s.setMediaUrls(media == null ? new ArrayList<>() : new ArrayList<>(List.of(media)));
        s.setStatus(status);
        s.setReviewComment(comment);
        s.setSubmittedAt(submittedAt);
        s.setReviewedAt(TaskSubmission.STATUS_PENDING.equals(status) ? null : submittedAt.plusHours(20));
        return s;
    }

    private void measure(Long memberId, LocalDate date, Double height, Double weight, String note) {
        GrowthMeasurement m = new GrowthMeasurement();
        m.setMemberId(memberId);
        m.setDate(date);
        m.setHeightCm(height);
        m.setWeightKg(weight);
        m.setNote(note);
        measurementRepository.save(m);
    }

    private void milestone(Long memberId, String title, LocalDate date, String description, String icon) {
        Milestone m = new Milestone();
        m.setMemberId(memberId);
        m.setTitle(title);
        m.setDate(date);
        m.setDescription(description);
        m.setIcon(icon);
        m.setAchieved(Boolean.TRUE);
        milestoneRepository.save(m);
    }

    private void skill(Long memberId, String name, String category, int level, String note) {
        Skill s = new Skill();
        s.setMemberId(memberId);
        s.setName(name);
        s.setCategory(category);
        s.setLevel(level);
        s.setNote(note);
        skillRepository.save(s);
    }

    private String avatar(String prompt) {
        return img(prompt, "square");
    }

    private String img(String prompt, String size) {
        String sizeParam = switch (size) {
            case "landscape_4_3" -> "width=1024&height=768";
            case "landscape_16_9" -> "width=1280&height=720";
            case "portrait_4_3" -> "width=768&height=1024";
            case "portrait_16_9" -> "width=720&height=1280";
            default -> "width=1024&height=1024";
        };
        return "https://image.pollinations.ai/prompt/"
                + URLEncoder.encode(prompt, StandardCharsets.UTF_8).replace("+", "%20")
                + "?" + sizeParam + "&nologo=true";
    }
}
