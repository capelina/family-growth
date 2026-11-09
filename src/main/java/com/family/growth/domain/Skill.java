package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 技能发展。
 */
@Entity
@Table(name = "fg_skill")
@Getter
@Setter
@NoArgsConstructor
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 60)
    private String name;

    /** 艺术 / 运动 / 学习 / 生活 / 社交 */
    @Column(length = 30)
    private String category;

    /** 掌握程度 1-5 */
    private Integer level = 1;

    @Column(length = 300)
    private String note;

    private LocalDateTime updatedAt = LocalDateTime.now();
}
