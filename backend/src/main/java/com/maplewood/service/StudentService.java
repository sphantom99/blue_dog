package com.maplewood.service;

import com.maplewood.dto.*;
import com.maplewood.model.*;
import com.maplewood.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private static final BigDecimal TOTAL_CREDITS_REQUIRED = new BigDecimal("30.0");
    private static final BigDecimal GPA_SCALE = new BigDecimal("4.0");

    private final StudentRepository studentRepository;
    private final StudentCourseHistoryRepository historyRepository;

    public StudentProfileDTO getStudentProfile(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentId));

        List<StudentCourseHistory> history = historyRepository.findByStudentIdWithDetails(studentId);

        BigDecimal creditsPassed = BigDecimal.ZERO;
        BigDecimal creditsAttempted = BigDecimal.ZERO;

        for (StudentCourseHistory h : history) {
            BigDecimal credits = h.getCourse().getCredits();
            creditsAttempted = creditsAttempted.add(credits);
            if (CourseHistoryStatus.PASSED.getValue().equals(h.getStatus())) {
                creditsPassed = creditsPassed.add(credits);
            }
        }

        // GPA: (credits_passed / total_credits_attempted) * 4.0
        BigDecimal gpa = BigDecimal.ZERO;
        if (creditsAttempted.compareTo(BigDecimal.ZERO) > 0) {
            gpa = creditsPassed.divide(creditsAttempted, 4, RoundingMode.HALF_UP)
                    .multiply(GPA_SCALE)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        List<CourseHistoryDTO> historyDTOs = history.stream()
                .map(h -> new CourseHistoryDTO(
                        h.getCourse().getId(),
                        h.getCourse().getCode(),
                        h.getCourse().getName(),
                        h.getCourse().getCredits(),
                        h.getSemester().getName(),
                        h.getSemester().getYear(),
                        h.getStatus()))
                .collect(Collectors.toList());

        return new StudentProfileDTO(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getGradeLevel(),
                student.getStatus(),
                gpa,
                creditsPassed,
                creditsAttempted,
                TOTAL_CREDITS_REQUIRED,
                historyDTOs);
    }
}
