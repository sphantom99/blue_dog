package com.maplewood.controller;

import com.maplewood.dto.CourseDTO;
import com.maplewood.dto.CourseSectionDTO;
import com.maplewood.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping("/courses")
    public ResponseEntity<List<CourseDTO>> getCourses(
            @RequestParam(required = false) Integer gradeLevel,
            @RequestParam(required = false, name = "semester") Integer semesterOrder) {
        return ResponseEntity.ok(courseService.getAvailableCourses(gradeLevel, semesterOrder));
    }

    @GetMapping("/courses/{id}/sections")
    public ResponseEntity<List<CourseSectionDTO>> getSectionsForCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getSectionsForCourse(id));
    }

    @GetMapping("/sections")
    public ResponseEntity<List<CourseSectionDTO>> getSectionsBySemester(
            @RequestParam Long semesterId) {
        return ResponseEntity.ok(courseService.getSectionsBySemester(semesterId));
    }
}
