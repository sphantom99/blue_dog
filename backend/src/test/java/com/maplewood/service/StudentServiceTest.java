package com.maplewood.service;

import com.maplewood.dto.StudentProfileDTO;
import com.maplewood.model.*;
import com.maplewood.repository.StudentCourseHistoryRepository;
import com.maplewood.repository.StudentRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentCourseHistoryRepository historyRepository;

    @InjectMocks
    private StudentService studentService;

    private Student student;
    private Specialization specialization;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setFirstName("Jane");
        student.setLastName("Doe");
        student.setEmail("jane@maplewood.edu");
        student.setGradeLevel(10);
        student.setStatus("active");

        specialization = new Specialization();
        specialization.setId(1L);
        specialization.setName("English");
    }

    @Test
    void getStudentProfile_calculatesGpaCorrectly() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        Course passedCourse = makeCourse(1L, "ENG101", new BigDecimal("3.0"));
        Course failedCourse = makeCourse(2L, "MATH101", new BigDecimal("3.0"));

        Semester semester = makeSemester(1L, "Fall");

        StudentCourseHistory passed = makeHistory(passedCourse, semester, "passed");
        StudentCourseHistory failed = makeHistory(failedCourse, semester, "failed");

        when(historyRepository.findByStudentIdWithDetails(1L)).thenReturn(List.of(passed, failed));

        StudentProfileDTO profile = studentService.getStudentProfile(1L);

        // 3 passed out of 6 attempted → 3/6 * 4.0 = 2.00
        assertEquals(new BigDecimal("2.00"), profile.getGpa());
        assertEquals(new BigDecimal("3.0"), profile.getCreditsPassed());
        assertEquals(new BigDecimal("6.0"), profile.getCreditsAttempted());
    }

    @Test
    void getStudentProfile_zeroHistory_gpaIsZero() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(historyRepository.findByStudentIdWithDetails(1L)).thenReturn(List.of());

        StudentProfileDTO profile = studentService.getStudentProfile(1L);

        assertEquals(BigDecimal.ZERO, profile.getGpa());
        assertEquals(BigDecimal.ZERO, profile.getCreditsPassed());
    }

    @Test
    void getStudentProfile_allPassed_gpaIsFour() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        Course course = makeCourse(1L, "ENG101", new BigDecimal("3.0"));
        Semester semester = makeSemester(1L, "Fall");
        StudentCourseHistory passed = makeHistory(course, semester, "passed");

        when(historyRepository.findByStudentIdWithDetails(1L)).thenReturn(List.of(passed));

        StudentProfileDTO profile = studentService.getStudentProfile(1L);

        assertEquals(new BigDecimal("4.00"), profile.getGpa());
    }

    @Test
    void getStudentProfile_studentNotFound_throws() {
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> studentService.getStudentProfile(99L));
    }

    @Test
    void getStudentProfile_includesCourseHistory() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        Course course = makeCourse(1L, "ENG101", new BigDecimal("3.0"));
        Semester semester = makeSemester(1L, "Fall");
        StudentCourseHistory history = makeHistory(course, semester, "passed");

        when(historyRepository.findByStudentIdWithDetails(1L)).thenReturn(List.of(history));

        StudentProfileDTO profile = studentService.getStudentProfile(1L);

        assertEquals(1, profile.getCourseHistory().size());
        assertEquals("ENG101", profile.getCourseHistory().get(0).getCourseCode());
        assertEquals("passed", profile.getCourseHistory().get(0).getStatus());
    }

    private Course makeCourse(Long id, String code, BigDecimal credits) {
        Course course = new Course();
        course.setId(id);
        course.setCode(code);
        course.setName(code);
        course.setCredits(credits);
        course.setSpecialization(specialization);
        return course;
    }

    private Semester makeSemester(Long id, String name) {
        Semester semester = new Semester();
        semester.setId(id);
        semester.setName(name);
        semester.setYear(2026);
        return semester;
    }

    private StudentCourseHistory makeHistory(Course course, Semester semester, String status) {
        StudentCourseHistory h = new StudentCourseHistory();
        h.setStudent(student);
        h.setCourse(course);
        h.setSemester(semester);
        h.setStatus(status);
        return h;
    }
}
