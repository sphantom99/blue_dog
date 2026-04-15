package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SemesterDTO {
    private Long id;
    private String name;
    private Integer year;
    private Integer orderInYear;
    private String startDate;
    private String endDate;
    private Boolean isActive;
}
