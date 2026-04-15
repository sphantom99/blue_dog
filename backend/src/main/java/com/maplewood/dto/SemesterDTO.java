package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class SemesterDTO {
    private Long id;
    private String name;
    private Integer year;
    private Integer orderInYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
}
