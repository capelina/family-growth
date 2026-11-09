package com.family.growth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 身高体重测量记录，用于成长曲线。
 */
@Entity
@Table(name = "fg_measurement")
@Getter
@Setter
@NoArgsConstructor
public class GrowthMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private LocalDate date;

    private Double heightCm;

    private Double weightKg;

    @Column(length = 200)
    private String note;
}
