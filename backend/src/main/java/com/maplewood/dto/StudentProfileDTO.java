package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class StudentProfileDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Integer gradeLevel;
    private String status;
    private BigDecimal gpa;
    private BigDecimal creditsPassed;
    private BigDecimal creditsAttempted;
    private BigDecimal totalCreditsRequired;
    private List<CourseHistoryDTO> courseHistory;
}
