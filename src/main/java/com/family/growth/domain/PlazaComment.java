package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 广场评论。
 */
@Entity
@Table(name = "fg_comment")
@Getter
@Setter
@NoArgsConstructor
public class PlazaComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recordId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 600)
    private String content;

    private LocalDateTime createdAt = LocalDateTime.now();
}
