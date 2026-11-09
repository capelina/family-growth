package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 广场点赞。
 */
@Entity
@Table(name = "fg_like",
        uniqueConstraints = @UniqueConstraint(name = "uk_like_record_user", columnNames = {"record_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class PlazaLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_id", nullable = false)
    private Long recordId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private LocalDateTime createdAt = LocalDateTime.now();
}
