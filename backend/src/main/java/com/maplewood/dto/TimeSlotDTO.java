package com.maplewood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TimeSlotDTO {
    private Long id;
    private Integer dayOfWeek;
    private String startTime;
    private String endTime;
}
