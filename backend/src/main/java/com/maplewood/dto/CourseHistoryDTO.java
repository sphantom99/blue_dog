package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CourseHistoryDTO {
    private Long courseId;
    private String courseCode;
    private String courseName;
    private BigDecimal credits;
    private String semesterName;
    private Integer semesterYear;
    private String status;
}
