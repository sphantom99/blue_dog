package com.maplewood.controller;

import com.maplewood.dto.*;
import com.maplewood.model.Semester;
import com.maplewood.repository.SemesterRepository;
import com.maplewood.service.EnrollmentService;
import com.maplewood.service.StudentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StudentService studentService;

    @MockitoBean
    private EnrollmentService enrollmentService;

    @MockitoBean
    private SemesterRepository semesterRepository;

    @Test
    void getStudentProfile_returnsProfile() throws Exception {
        StudentProfileDTO profile = new StudentProfileDTO(
                1L, "Jane", "Doe", "jane@maplewood.edu", 10, "active",
                new BigDecimal("3.50"), new BigDecimal("12.0"),
                new BigDecimal("14.0"), new BigDecimal("30.0"), List.of());
        when(studentService.getStudentProfile(1L)).thenReturn(profile);

        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.gpa").value(3.50))
                .andExpect(jsonPath("$.gradeLevel").value(10));
    }

    @Test
    void getStudentSchedule_returnsSchedule() throws Exception {
        Semester semester = new Semester();
        semester.setId(7L);
        semester.setName("Fall");
        semester.setIsActive(true);
        when(semesterRepository.findByIsActiveTrue()).thenReturn(Optional.of(semester));

        ScheduleDTO schedule = new ScheduleDTO(7L, "Fall", List.of());
        when(enrollmentService.getStudentSchedule(1L, 7L)).thenReturn(schedule);

        mockMvc.perform(get("/api/students/1/schedule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.semesterName").value("Fall"))
                .andExpect(jsonPath("$.enrolledSections").isArray());
    }
}
