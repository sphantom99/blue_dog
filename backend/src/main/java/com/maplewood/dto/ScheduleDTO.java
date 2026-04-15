package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ScheduleDTO {
    private Long semesterId;
    private String semesterName;
    private List<CourseSectionDTO> enrolledSections;
}
