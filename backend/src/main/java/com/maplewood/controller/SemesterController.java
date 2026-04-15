package com.maplewood.controller;

import com.maplewood.dto.SemesterDTO;
import com.maplewood.model.Semester;
import com.maplewood.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterRepository semesterRepository;

    @GetMapping("/active")
    public ResponseEntity<SemesterDTO> getActiveSemester() {
        Semester semester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalStateException("No active semester found"));
        return ResponseEntity.ok(new SemesterDTO(
                semester.getId(),
                semester.getName(),
                semester.getYear(),
                semester.getOrderInYear(),
                semester.getStartDate(),
                semester.getEndDate(),
                semester.getIsActive()));
    }
}
