package com.maplewood.controller;

import com.maplewood.dto.EnrollmentRequestDTO;
import com.maplewood.dto.EnrollmentResponseDTO;
import com.maplewood.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<EnrollmentResponseDTO> enroll(@Valid @RequestBody EnrollmentRequestDTO request) {
        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                request.getStudentId(), request.getSectionId());
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PatchMapping("/{id}/drop")
    public ResponseEntity<EnrollmentResponseDTO> drop(@PathVariable Long id) {
        EnrollmentResponseDTO response = enrollmentService.dropEnrollment(id);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
