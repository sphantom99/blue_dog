package com.maplewood.service;

import com.maplewood.dto.*;
import com.maplewood.model.*;
import com.maplewood.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final SemesterRepository semesterRepository;
    private final CourseSectionDTOMapper sectionMapper;

    public List<CourseDTO> getAvailableCourses(Integer gradeLevel, Integer semesterOrder) {
        List<Course> courses;
        if (gradeLevel != null && semesterOrder != null) {
            courses = courseRepository.findAvailableCourses(gradeLevel, semesterOrder);
        } else if (semesterOrder != null) {
            courses = courseRepository.findBySemesterOrder(semesterOrder);
        } else {
            courses = courseRepository.findAll();
        }
        return courses.stream().map(this::mapToCourseDTO).collect(Collectors.toList());
    }

    public List<CourseSectionDTO> getSectionsForCourse(Long courseId) {
        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalStateException("No active semester found"));

        List<CourseSection> sections = courseSectionRepository.findByCourseIdAndSemesterIdWithDetails(
                courseId, activeSemester.getId());

        return sections.stream()
                .map(sectionMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<CourseSectionDTO> getSectionsBySemester(Long semesterId) {
        List<CourseSection> sections = courseSectionRepository.findBySemesterIdWithDetails(semesterId);
        return sections.stream()
                .map(sectionMapper::toDTO)
                .collect(Collectors.toList());
    }

    private CourseDTO mapToCourseDTO(Course course) {
        Course prereq = course.getPrerequisite();
        return new CourseDTO(
                course.getId(),
                course.getCode(),
                course.getName(),
                course.getDescription(),
                course.getCredits(),
                course.getHoursPerWeek(),
                course.getSpecialization().getName(),
                course.getCourseType(),
                course.getGradeLevelMin(),
                course.getGradeLevelMax(),
                course.getSemesterOrder(),
                prereq != null ? prereq.getId() : null,
                prereq != null ? prereq.getCode() : null,
                prereq != null ? prereq.getName() : null);
    }
}
