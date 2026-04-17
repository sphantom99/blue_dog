package com.maplewood.service;

import com.maplewood.dto.CourseSectionDTO;
import com.maplewood.dto.SectionMeetingDTO;
import com.maplewood.dto.TimeSlotDTO;
import com.maplewood.model.CourseSection;
import com.maplewood.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CourseSectionDTOMapper {

    private final EnrollmentRepository enrollmentRepository;

    public CourseSectionDTO toDTO(CourseSection section) {
        long enrolledCount = enrollmentRepository.countBySectionIdAndStatus(
                section.getId(), EnrollmentStatus.ENROLLED.getValue());

        int capacity = section.getMeetings().stream()
                .mapToInt(m -> m.getClassroom().getCapacity())
                .min()
                .orElse(0);

        List<SectionMeetingDTO> meetingDTOs = section.getMeetings().stream()
                .map(m -> new SectionMeetingDTO(
                        m.getId(),
                        m.getClassroom().getName(),
                        m.getClassroom().getCapacity(),
                        new TimeSlotDTO(
                                m.getTimeslot().getId(),
                                m.getTimeslot().getDayOfWeek(),
                                m.getTimeslot().getStartTime(),
                                m.getTimeslot().getEndTime())))
                .collect(Collectors.toList());

        return new CourseSectionDTO(
                section.getId(),
                null,
                section.getCourse().getId(),
                section.getCourse().getCode(),
                section.getCourse().getName(),
                section.getCourse().getSpecialization() != null
                        ? section.getCourse().getSpecialization().getName()
                        : null,
                section.getTeacher().getFirstName(),
                section.getTeacher().getLastName(),
                section.getSectionLabel(),
                capacity,
                enrolledCount,
                meetingDTOs);
    }
}
