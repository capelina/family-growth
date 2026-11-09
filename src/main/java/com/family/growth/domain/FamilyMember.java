package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 家庭成员：既包含家长，也包含孩子。
 */
@Entity
@Table(name = "fg_member")
@Getter
@Setter
@NoArgsConstructor
public class FamilyMember {

    public static final String ROLE_PARENT = "PARENT";
    public static final String ROLE_CHILD = "CHILD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long familyId;

    /** 关联的登录账号，孩子的档案可以为空 */
    private Long userId;

    @Column(nullable = false, length = 40)
    private String name;

    @Column(nullable = false, length = 20)
    private String role = ROLE_CHILD;

    /** 爸爸 / 妈妈 / 儿子 / 女儿 / 爷爷 ... */
    @Column(length = 20)
    private String relation;

    @Column(length = 300)
    private String avatar;

    private LocalDate birthday;

    /** 成长积分（主要给孩子） */
    private Integer points = 0;

    /** 个人主题色 */
    @Column(length = 20)
    private String color;

    private LocalDateTime joinedAt = LocalDateTime.now();
}
