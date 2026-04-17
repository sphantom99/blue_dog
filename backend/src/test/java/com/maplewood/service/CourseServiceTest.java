package com.maplewood.service;

import com.maplewood.dto.CourseDTO;
import com.maplewood.dto.CourseSectionDTO;
import com.maplewood.model.*;
import com.maplewood.repository.CourseRepository;
import com.maplewood.repository.CourseSectionRepository;
import com.maplewood.repository.SemesterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseSectionRepository courseSectionRepository;

    @Mock
    private SemesterRepository semesterRepository;

    @Mock
    private CourseSectionDTOMapper sectionMapper;

    @InjectMocks
    private CourseService courseService;

    private Specialization specialization;
    private Semester activeSemester;

    @BeforeEach
    void setUp() {
        specialization = new Specialization();
        specialization.setId(1L);
        specialization.setName("English");

        activeSemester = new Semester();
        activeSemester.setId(7L);
        activeSemester.setName("Fall");
        activeSemester.setIsActive(true);
    }

    @Test
    void getAvailableCourses_withGradeAndSemester_filtersCorrectly() {
        Course course = makeCourse(1L, "ENG101", "English I");
        when(courseRepository.findAvailableCourses(10, 1)).thenReturn(List.of(course));

        List<CourseDTO> result = courseService.getAvailableCourses(10, 1);

        assertEquals(1, result.size());
        assertEquals("ENG101", result.get(0).getCode());
        assertEquals("English", result.get(0).getSpecialization());
    }

    @Test
    void getAvailableCourses_semesterOnly_usesSemesterFilter() {
        Course course = makeCourse(1L, "MATH101", "Math I");
        when(courseRepository.findBySemesterOrder(1)).thenReturn(List.of(course));

        List<CourseDTO> result = courseService.getAvailableCourses(null, 1);

        assertEquals(1, result.size());
        assertEquals("MATH101", result.get(0).getCode());
    }

    @Test
    void getAvailableCourses_noFilters_returnsAll() {
        when(courseRepository.findAll()).thenReturn(List.of());

        List<CourseDTO> result = courseService.getAvailableCourses(null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void getAvailableCourses_mapsPrerequisiteFields() {
        Course prereq = makeCourse(1L, "ENG100", "Intro English");
        Course course = makeCourse(2L, "ENG101", "English I");
        course.setPrerequisite(prereq);

        when(courseRepository.findAvailableCourses(10, 1)).thenReturn(List.of(course));

        List<CourseDTO> result = courseService.getAvailableCourses(10, 1);

        assertEquals(1L, result.get(0).getPrerequisiteId());
        assertEquals("ENG100", result.get(0).getPrerequisiteCode());
        assertEquals("Intro English", result.get(0).getPrerequisiteName());
    }

    @Test
    void getSectionsForCourse_noActiveSemester_throws() {
        when(semesterRepository.findByIsActiveTrue()).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> courseService.getSectionsForCourse(1L));
    }

    @Test
    void getSectionsForCourse_returnsMappedSections() {
        when(semesterRepository.findByIsActiveTrue()).thenReturn(Optional.of(activeSemester));

        CourseSection section = new CourseSection();
        section.setId(1L);
        when(courseSectionRepository.findByCourseIdAndSemesterIdWithDetails(1L, 7L))
                .thenReturn(List.of(section));

        CourseSectionDTO dto = new CourseSectionDTO(
                1L, null, 1L, "ENG101", "English I", "English",
                "John", "Smith", "A", 30, 5L, List.of());
        when(sectionMapper.toDTO(any(CourseSection.class))).thenReturn(dto);

        List<CourseSectionDTO> result = courseService.getSectionsForCourse(1L);

        assertEquals(1, result.size());
        assertEquals("ENG101", result.get(0).getCourseCode());
    }

    @Test
    void getSectionsBySemester_returnsMappedSections() {
        CourseSection section = new CourseSection();
        section.setId(1L);
        when(courseSectionRepository.findBySemesterIdWithDetails(7L))
                .thenReturn(List.of(section));

        CourseSectionDTO dto = new CourseSectionDTO(
                1L, null, 1L, "ENG101", "English I", "English",
                "John", "Smith", "A", 30, 5L, List.of());
        when(sectionMapper.toDTO(any(CourseSection.class))).thenReturn(dto);

        List<CourseSectionDTO> result = courseService.getSectionsBySemester(7L);

        assertEquals(1, result.size());
    }

    private Course makeCourse(Long id, String code, String name) {
        Course course = new Course();
        course.setId(id);
        course.setCode(code);
        course.setName(name);
        course.setDescription("Description");
        course.setCredits(new BigDecimal("3.0"));
        course.setHoursPerWeek(3);
        course.setSpecialization(specialization);
        course.setCourseType("core");
        course.setGradeLevelMin(9);
        course.setGradeLevelMax(12);
        course.setSemesterOrder(1);
        return course;
    }
}
