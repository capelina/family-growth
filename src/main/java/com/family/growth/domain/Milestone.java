package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 成长里程碑。
 */
@Entity
@Table(name = "fg_milestone")
@Getter
@Setter
@NoArgsConstructor
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 120)
    private String title;

    private LocalDate date;

    @Column(length = 1000)
    private String description;

    /** 图标标识，前端映射为图标 */
    @Column(length = 30)
    private String icon;

    @Column(length = 300)
    private String cover;

    private Boolean achieved = Boolean.TRUE;
}
