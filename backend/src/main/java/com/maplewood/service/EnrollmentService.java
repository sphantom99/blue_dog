package com.maplewood.service;

import com.maplewood.dto.*;
import com.maplewood.model.*;
import com.maplewood.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private static final int MAX_COURSES = 5;

    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final StudentCourseHistoryRepository historyRepository;
    private final CourseSectionDTOMapper sectionMapper;

    @Transactional
    public EnrollmentResponseDTO enrollStudent(Long studentId, Long sectionId) {
        List<ValidationErrorDTO> errors = new ArrayList<>();

        // 1. Student exists & is active
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.STUDENT_NOT_FOUND.name(),
                    "Student not found: " + studentId));
            return EnrollmentResponseDTO.fail(errors);
        }
        Student student = studentOpt.get();
        if (!StudentStatus.ACTIVE.getValue().equals(student.getStatus())) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.STUDENT_NOT_FOUND.name(),
                    "Student is not active: " + studentId));
            return EnrollmentResponseDTO.fail(errors);
        }

        // 2. Section exists & belongs to active semester
        Optional<CourseSection> sectionOpt = courseSectionRepository.findByIdWithDetails(sectionId);
        if (sectionOpt.isEmpty()) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.SECTION_NOT_FOUND.name(),
                    "Section not found: " + sectionId));
            return EnrollmentResponseDTO.fail(errors);
        }
        CourseSection section = sectionOpt.get();

        Optional<Semester> activeSemesterOpt = semesterRepository.findByIsActiveTrue();
        if (activeSemesterOpt.isEmpty() || !section.getSemester().getId().equals(activeSemesterOpt.get().getId())) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.SECTION_NOT_FOUND.name(),
                    "Section does not belong to the active semester"));
            return EnrollmentResponseDTO.fail(errors);
        }
        Semester activeSemester = activeSemesterOpt.get();
        Course course = section.getCourse();

        // 3. Course grade level: student must be at or above the minimum grade.
        if (student.getGradeLevel() < course.getGradeLevelMin()) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.GRADE_MISMATCH.name(),
                    "Course " + course.getCode() + " requires grade "
                            + course.getGradeLevelMin()
                            + " or above, student is grade " + student.getGradeLevel()));
        }

        // 4. Max 5 courses (only count enrolled, not dropped)
        long enrolledCount = enrollmentRepository.countByStudentIdAndSectionSemesterIdAndStatus(
                studentId, activeSemester.getId(), EnrollmentStatus.ENROLLED.getValue());
        if (enrolledCount >= MAX_COURSES) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.MAX_COURSES_EXCEEDED.name(),
                    "Already enrolled in " + enrolledCount + " courses (max " + MAX_COURSES + ")"));
        }

        // 5. Prerequisite passed
        if (course.getPrerequisite() != null) {
            boolean prereqPassed = historyRepository.existsByStudentIdAndCourseIdAndStatus(
                    studentId, course.getPrerequisite().getId(), CourseHistoryStatus.PASSED.getValue());
            if (!prereqPassed) {
                errors.add(new ValidationErrorDTO(
                        EnrollmentErrorCode.PREREQ_NOT_MET.name(),
                        "Missing prerequisite: " + course.getPrerequisite().getCode()));
            }
        }

        // 8. Not already enrolled in same course
        boolean alreadyEnrolled = enrollmentRepository.existsByStudentIdAndSectionCourseIdAndSectionSemesterIdAndStatus(
                studentId, course.getId(), activeSemester.getId(), EnrollmentStatus.ENROLLED.getValue());
        if (alreadyEnrolled) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.ALREADY_ENROLLED.name(),
                    "Already enrolled in " + course.getCode()));
        }

        // 6. Time conflict
        Set<Long> newTimeslotIds = section.getMeetings().stream()
                .map(m -> m.getTimeslot().getId())
                .collect(Collectors.toSet());

        List<Enrollment> currentEnrollments = enrollmentRepository.findByStudentIdAndSemesterIdWithDetails(
                studentId, activeSemester.getId()).stream()
                .filter(e -> EnrollmentStatus.ENROLLED.getValue().equals(e.getStatus()))
                .collect(Collectors.toList());

        for (Enrollment existing : currentEnrollments) {
            CourseSection existingSection = existing.getSection();
            for (SectionMeeting meeting : existingSection.getMeetings()) {
                if (newTimeslotIds.contains(meeting.getTimeslot().getId())) {
                    errors.add(new ValidationErrorDTO(
                            EnrollmentErrorCode.TIME_CONFLICT.name(),
                            "Conflicts with existing enrollment: " + existingSection.getCourse().getCode()));
                    break;
                }
            }
        }

        // 7. Capacity
        int minCapacity = section.getMeetings().stream()
                .mapToInt(m -> m.getClassroom().getCapacity())
                .min()
                .orElse(0);
        long sectionEnrolled = enrollmentRepository.countBySectionIdAndStatus(
                sectionId, EnrollmentStatus.ENROLLED.getValue());
        if (sectionEnrolled >= minCapacity) {
            errors.add(new ValidationErrorDTO(
                    EnrollmentErrorCode.SECTION_FULL.name(),
                    "Section is full (" + sectionEnrolled + "/" + minCapacity + ")"));
        }

        if (!errors.isEmpty()) {
            return EnrollmentResponseDTO.fail(errors);
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(EnrollmentStatus.ENROLLED.getValue());
        enrollment.setCreatedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);

        return EnrollmentResponseDTO.ok();
    }

    @Transactional
    public EnrollmentResponseDTO dropEnrollment(Long enrollmentId) {
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(enrollmentId);
        if (enrollmentOpt.isEmpty()) {
            return EnrollmentResponseDTO.fail(List.of(
                    new ValidationErrorDTO(EnrollmentErrorCode.SECTION_NOT_FOUND.name(),
                            "Enrollment not found: " + enrollmentId)));
        }

        Enrollment enrollment = enrollmentOpt.get();
        if (EnrollmentStatus.DROPPED.getValue().equals(enrollment.getStatus())) {
            return EnrollmentResponseDTO.fail(List.of(
                    new ValidationErrorDTO(EnrollmentErrorCode.ALREADY_ENROLLED.name(),
                            "Enrollment is already dropped")));
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED.getValue());
        enrollmentRepository.save(enrollment);

        return EnrollmentResponseDTO.ok();
    }

    public ScheduleDTO getStudentSchedule(Long studentId, Long semesterId) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found: " + semesterId));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndSemesterIdWithDetails(
                studentId, semesterId);

        List<CourseSectionDTO> sections = enrollments.stream()
                .filter(e -> EnrollmentStatus.ENROLLED.getValue().equals(e.getStatus()))
                .map(e -> {
                    CourseSectionDTO dto = sectionMapper.toDTO(e.getSection());
                    dto.setEnrollmentId(e.getId());
                    return dto;
                })
                .collect(Collectors.toList());

        return new ScheduleDTO(semesterId, semester.getName(), sections);
    }
}
