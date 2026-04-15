package com.maplewood.controller;

import com.maplewood.dto.ScheduleDTO;
import com.maplewood.dto.StudentProfileDTO;
import com.maplewood.model.Semester;
import com.maplewood.repository.SemesterRepository;
import com.maplewood.service.EnrollmentService;
import com.maplewood.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final EnrollmentService enrollmentService;
    private final SemesterRepository semesterRepository;

    @GetMapping("/{id}")
    public ResponseEntity<StudentProfileDTO> getStudentProfile(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentProfile(id));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<ScheduleDTO> getStudentSchedule(@PathVariable Long id) {
        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalStateException("No active semester found"));
        return ResponseEntity.ok(enrollmentService.getStudentSchedule(id, activeSemester.getId()));
    }
}
