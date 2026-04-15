package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CourseSectionDTO {
    private Long id;
    private Long enrollmentId;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String specialization;
    private String teacherFirstName;
    private String teacherLastName;
    private String sectionLabel;
    private Integer capacity;
    private Long enrolledCount;
    private List<SectionMeetingDTO> meetings;
}
