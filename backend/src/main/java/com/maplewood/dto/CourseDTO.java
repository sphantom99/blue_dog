package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CourseDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private BigDecimal credits;
    private Integer hoursPerWeek;
    private String specialization;
    private String courseType;
    private Integer gradeLevelMin;
    private Integer gradeLevelMax;
    private Integer semesterOrder;
    private Long prerequisiteId;
    private String prerequisiteCode;
    private String prerequisiteName;
}
