package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SectionMeetingDTO {
    private Long id;
    private String classroomName;
    private Integer classroomCapacity;
    private TimeSlotDTO timeslot;
}
