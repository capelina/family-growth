package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "fg_family")
@Getter
@Setter
@NoArgsConstructor
public class Family {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 200)
    private String motto;

    @Column(length = 300)
    private String cover;

    /** 邀请码，用于邀请配偶/家人加入 */
    @Column(nullable = false, unique = true, length = 12)
    private String inviteCode;

    /** 创建者用户 ID */
    private Long ownerUserId;

    private LocalDateTime createdAt = LocalDateTime.now();
}
