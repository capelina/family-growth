package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "fg_user")
@Getter
@Setter
@NoArgsConstructor
public class User {

    public static final String ROLE_PARENT = "PARENT";
    public static final String ROLE_CHILD = "CHILD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String username;

    @Column(nullable = false, length = 120)
    private String passwordHash;

    @Column(length = 40)
    private String nickname;

    @Column(length = 300)
    private String avatar;

    @Column(length = 80)
    private String email;

    @Column(length = 30)
    private String phone;

    /** 账号身份：家长（PARENT）或亲子成员（CHILD） */
    @Column(length = 20)
    private String role = ROLE_PARENT;

    /** 当前所属家庭 */
    private Long familyId;

    private LocalDateTime createdAt = LocalDateTime.now();

    /** 兼容历史数据：老账号没有身份字段时按家长处理 */
    public String effectiveRole() {
        return (role == null || role.isBlank()) ? ROLE_PARENT : role;
    }

    public boolean isChild() {
        return ROLE_CHILD.equals(effectiveRole());
    }
}
