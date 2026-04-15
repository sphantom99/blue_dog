package com.maplewood.controller;

import com.maplewood.dto.*;
import com.maplewood.service.CourseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CourseController.class)
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CourseService courseService;

    @Test
    void getCourses_returnsFilteredList() throws Exception {
        CourseDTO course = new CourseDTO(1L, "ENG101", "English I", "Intro",
                new BigDecimal("3.0"), 3, "English", "core", 9, 12, 1,
                null, null, null);
        when(courseService.getAvailableCourses(9, 1)).thenReturn(List.of(course));

        mockMvc.perform(get("/api/courses")
                .param("gradeLevel", "9")
                .param("semester", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("ENG101"))
                .andExpect(jsonPath("$[0].name").value("English I"));
    }

    @Test
    void getCourses_noFilters_returnsAll() throws Exception {
        when(courseService.getAvailableCourses(null, null)).thenReturn(List.of());

        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getSectionsForCourse_returnsSections() throws Exception {
        CourseSectionDTO section = new CourseSectionDTO(
                1L, 1L, "ENG101", "English I", "John", "Smith", "A",
                10, 3L, List.of());
        when(courseService.getSectionsForCourse(1L)).thenReturn(List.of(section));

        mockMvc.perform(get("/api/courses/1/sections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sectionLabel").value("A"))
                .andExpect(jsonPath("$[0].enrolledCount").value(3));
    }

    @Test
    void getSectionsBySemester_returnsSections() throws Exception {
        when(courseService.getSectionsBySemester(7L)).thenReturn(List.of());

        mockMvc.perform(get("/api/sections").param("semesterId", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
