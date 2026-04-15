package com.maplewood.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column
    private String description;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal credits;

    @Column(name = "hours_per_week", nullable = false)
    private Integer hoursPerWeek;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialization_id", nullable = false)
    private Specialization specialization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prerequisite_id")
    private Course prerequisite;

    @Column(name = "course_type", nullable = false)
    private String courseType;

    @Column(name = "grade_level_min", nullable = false)
    private Integer gradeLevelMin;

    @Column(name = "grade_level_max", nullable = false)
    private Integer gradeLevelMax;

    @Column(name = "semester_order", nullable = false)
    private Integer semesterOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
