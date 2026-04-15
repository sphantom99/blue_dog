package com.maplewood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maplewood.dto.*;
import com.maplewood.service.EnrollmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EnrollmentController.class)
class EnrollmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EnrollmentService enrollmentService;

    @Test
    void enrollSuccess_returns200() throws Exception {
        when(enrollmentService.enrollStudent(1L, 1L))
                .thenReturn(EnrollmentResponseDTO.ok());

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(1L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void enrollPrereqNotMet_returns400() throws Exception {
        when(enrollmentService.enrollStudent(1L, 1L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("PREREQ_NOT_MET", "Missing prerequisite: MAT101"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(1L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[0].code").value("PREREQ_NOT_MET"));
    }

    @Test
    void enrollTimeConflict_returns400() throws Exception {
        when(enrollmentService.enrollStudent(1L, 2L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("TIME_CONFLICT", "Conflicts with existing enrollment: BIO201"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(2L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("TIME_CONFLICT"));
    }

    @Test
    void enrollMaxCoursesExceeded_returns400() throws Exception {
        when(enrollmentService.enrollStudent(1L, 3L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("MAX_COURSES_EXCEEDED", "Already enrolled in 5 courses (max 5)"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(3L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("MAX_COURSES_EXCEEDED"));
    }

    @Test
    void enrollSectionFull_returns400() throws Exception {
        when(enrollmentService.enrollStudent(1L, 4L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("SECTION_FULL", "Section is full (10/10)"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(4L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("SECTION_FULL"));
    }

    @Test
    void enrollAlreadyEnrolled_returns400() throws Exception {
        when(enrollmentService.enrollStudent(1L, 5L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("ALREADY_ENROLLED", "Already enrolled in ENG101"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(5L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("ALREADY_ENROLLED"));
    }

    @Test
    void enrollGradeMismatch_returns400() throws Exception {
        when(enrollmentService.enrollStudent(1L, 6L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("GRADE_MISMATCH",
                                "Course ENG301 is for grades 11-12, student is grade 9"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(6L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("GRADE_MISMATCH"));
    }

    @Test
    void enrollMultipleViolations_returnsAllErrors() throws Exception {
        when(enrollmentService.enrollStudent(1L, 7L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("GRADE_MISMATCH", "Grade mismatch"),
                        new ValidationErrorDTO("PREREQ_NOT_MET", "Missing prerequisite"),
                        new ValidationErrorDTO("TIME_CONFLICT", "Time conflict"))));

        EnrollmentRequestDTO request = new EnrollmentRequestDTO();
        request.setStudentId(1L);
        request.setSectionId(7L);

        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(3))
                .andExpect(jsonPath("$.errors[0].code").value("GRADE_MISMATCH"))
                .andExpect(jsonPath("$.errors[1].code").value("PREREQ_NOT_MET"))
                .andExpect(jsonPath("$.errors[2].code").value("TIME_CONFLICT"));
    }

    @Test
    void dropSuccess_returns200() throws Exception {
        when(enrollmentService.dropEnrollment(1L))
                .thenReturn(EnrollmentResponseDTO.ok());

        mockMvc.perform(patch("/api/enrollments/1/drop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void dropNotFound_returns400() throws Exception {
        when(enrollmentService.dropEnrollment(999L))
                .thenReturn(EnrollmentResponseDTO.fail(List.of(
                        new ValidationErrorDTO("SECTION_NOT_FOUND", "Enrollment not found: 999"))));

        mockMvc.perform(patch("/api/enrollments/999/drop"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void enrollMissingBody_returns400() throws Exception {
        mockMvc.perform(post("/api/enrollments")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
