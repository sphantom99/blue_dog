package com.maplewood.controller;

import com.maplewood.service.StudentService;
import com.maplewood.service.EnrollmentService;
import com.maplewood.repository.SemesterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StudentService studentService;

    @MockitoBean
    private EnrollmentService enrollmentService;

    @MockitoBean
    private SemesterRepository semesterRepository;

    @Test
    void illegalArgument_returns404WithStructuredError() throws Exception {
        when(studentService.getStudentProfile(999L))
                .thenThrow(new IllegalArgumentException("Student not found: 999"));

        mockMvc.perform(get("/api/students/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[0].code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.errors[0].message").value("Student not found: 999"));
    }

    @Test
    void illegalState_returns409WithStructuredError() throws Exception {
        when(semesterRepository.findByIsActiveTrue())
                .thenThrow(new IllegalStateException("No active semester found"));

        mockMvc.perform(get("/api/students/1/schedule"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[0].code").value("ILLEGAL_STATE"));
    }
}
