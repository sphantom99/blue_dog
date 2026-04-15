package com.maplewood.service;

import com.maplewood.dto.EnrollmentResponseDTO;
import com.maplewood.model.*;
import com.maplewood.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class EnrollmentServiceIntegrationTest {

    @Autowired
    private EnrollmentService enrollmentService;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private CourseSectionRepository courseSectionRepository;
    @Autowired
    private SemesterRepository semesterRepository;
    @Autowired
    private StudentCourseHistoryRepository historyRepository;
    @Autowired
    private TimeSlotRepository timeSlotRepository;
    @Autowired
    private ClassroomRepository classroomRepository;
    @Autowired
    private SpecializationRepository specializationRepository;
    @Autowired
    private TeacherRepository teacherRepository;
    @Autowired
    private SectionMeetingRepository sectionMeetingRepository;
    @Autowired
    private EntityManager entityManager;

    private Semester activeSemester;
    private Student testStudent;
    private Specialization spec;
    private Teacher teacher;
    private Classroom classroom;

    @BeforeEach
    void setUp() {
        // Clean slate for enrollments
        enrollmentRepository.deleteAll();

        // Get active semester from seeded data
        activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalStateException("No active semester — run populate_database.py first"));

        // Use a real student from seeded data (grade 9, active)
        testStudent = studentRepository.findAll().stream()
                .filter(s -> "active".equals(s.getStatus()) && s.getGradeLevel() == 9)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active grade-9 student found"));

        // Get shared resources for test sections
        spec = specializationRepository.findAll().get(0);
        teacher = teacherRepository.findAll().get(0);
        classroom = classroomRepository.findAll().get(0);
    }

    @Test
    void enrollSuccessfully() {
        // Find a section for the active semester that the student is eligible for
        CourseSection section = findEligibleSection(testStudent);
        assertNotNull(section, "Should have an eligible section for grade-9 student");

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(testStudent.getId(), section.getId());

        assertTrue(response.isSuccess());
        assertTrue(response.getErrors().isEmpty());
    }

    @Test
    void enrollMissingPrerequisite_returnsPrereqNotMet() {
        // Find a course with a prerequisite that the student hasn't passed
        CourseSection sectionWithPrereq = courseSectionRepository.findBySemesterIdWithDetails(activeSemester.getId())
                .stream()
                .filter(cs -> cs.getCourse().getPrerequisite() != null)
                .filter(cs -> !historyRepository.existsByStudentIdAndCourseIdAndStatus(
                        testStudent.getId(), cs.getCourse().getPrerequisite().getId(), "passed"))
                .filter(cs -> testStudent.getGradeLevel() >= cs.getCourse().getGradeLevelMin()
                        && testStudent.getGradeLevel() <= cs.getCourse().getGradeLevelMax())
                .findFirst()
                .orElse(null);

        if (sectionWithPrereq == null) {
            // Create a test course with prerequisite
            sectionWithPrereq = createSectionWithPrerequisite();
        }

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), sectionWithPrereq.getId());

        assertFalse(response.isSuccess());
        assertTrue(response.getErrors().stream()
                .anyMatch(e -> "PREREQ_NOT_MET".equals(e.getCode())));
    }

    @Test
    void enrollTimeConflict_returnsTimeConflict() {
        // First, enroll in a section
        CourseSection firstSection = findEligibleSection(testStudent);
        assertNotNull(firstSection);
        enrollmentService.enrollStudent(testStudent.getId(), firstSection.getId());

        // Create a second section that conflicts (same timeslot)
        CourseSection conflictingSection = createConflictingSection(firstSection);

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), conflictingSection.getId());

        assertFalse(response.isSuccess());
        assertTrue(response.getErrors().stream()
                .anyMatch(e -> "TIME_CONFLICT".equals(e.getCode())));
    }

    @Test
    void enrollMaxCoursesExceeded_returnsMaxExceeded() {
        // Enroll in 5 courses
        List<TimeSlot> allSlots = timeSlotRepository.findAllByOrderByDayOfWeekAscStartTimeAsc();
        int slotIndex = 0;

        for (int i = 0; i < 5; i++) {
            CourseSection section = createTestSection("TST" + (100 + i), "Test Course " + i,
                    allSlots.get(slotIndex));
            slotIndex++;
            EnrollmentResponseDTO res = enrollmentService.enrollStudent(testStudent.getId(), section.getId());
            assertTrue(res.isSuccess(), "Should enroll in course " + i + ": " + res.getErrors());
        }

        // Try 6th course
        CourseSection sixthSection = createTestSection("TST999", "Test Course Extra",
                allSlots.get(slotIndex));

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), sixthSection.getId());

        assertFalse(response.isSuccess());
        assertTrue(response.getErrors().stream()
                .anyMatch(e -> "MAX_COURSES_EXCEEDED".equals(e.getCode())));
    }

    @Test
    void enrollSectionFull_returnsSectionFull() {
        // Create a section and fill it to capacity (classroom capacity is max 10)
        TimeSlot slot = timeSlotRepository.findAll().get(0);
        CourseSection section = createTestSection("FULL01", "Full Course", slot);

        // Fill up the section with other students
        List<Student> otherStudents = studentRepository.findAll().stream()
                .filter(s -> "active".equals(s.getStatus()) && !s.getId().equals(testStudent.getId()))
                .limit(classroom.getCapacity())
                .collect(Collectors.toList());

        for (Student s : otherStudents) {
            Enrollment e = new Enrollment();
            e.setStudent(s);
            e.setSection(section);
            e.setStatus("enrolled");
            e.setCreatedAt(LocalDateTime.now());
            enrollmentRepository.save(e);
        }

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), section.getId());

        assertFalse(response.isSuccess());
        assertTrue(response.getErrors().stream()
                .anyMatch(e -> "SECTION_FULL".equals(e.getCode())));
    }

    @Test
    void enrollAlreadyEnrolled_returnsAlreadyEnrolled() {
        CourseSection section = findEligibleSection(testStudent);
        assertNotNull(section);

        // First enrollment
        enrollmentService.enrollStudent(testStudent.getId(), section.getId());

        // Try again
        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), section.getId());

        assertFalse(response.isSuccess());
        assertTrue(response.getErrors().stream()
                .anyMatch(e -> "ALREADY_ENROLLED".equals(e.getCode())));
    }

    @Test
    void enrollGradeMismatch_returnsGradeMismatch() {
        // Create a section for a course that doesn't match grade 9
        Course course = new Course();
        course.setCode("ADV999");
        course.setName("Advanced Course");
        course.setCredits(new BigDecimal("3.0"));
        course.setHoursPerWeek(3);
        course.setSpecialization(spec);
        course.setCourseType("elective");
        course.setGradeLevelMin(11);
        course.setGradeLevelMax(12);
        course.setSemesterOrder(activeSemester.getOrderInYear());
        course.setCreatedAt(LocalDateTime.now());
        courseRepository.save(course);

        TimeSlot slot = timeSlotRepository.findAll().get(0);
        CourseSection section = createTestSectionForCourse(course, slot);

        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), section.getId());

        assertFalse(response.isSuccess());
        assertTrue(response.getErrors().stream()
                .anyMatch(e -> "GRADE_MISMATCH".equals(e.getCode())));
    }

    @Test
    void dropEnrollment_setsStatusToDropped() {
        CourseSection section = findEligibleSection(testStudent);
        assertNotNull(section);
        enrollmentService.enrollStudent(testStudent.getId(), section.getId());

        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndSectionId(testStudent.getId(), section.getId())
                .orElseThrow();

        EnrollmentResponseDTO response = enrollmentService.dropEnrollment(enrollment.getId());

        assertTrue(response.isSuccess());
        Enrollment dropped = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        assertEquals("dropped", dropped.getStatus());
    }

    @Test
    void dropThenReEnroll_createsNewEnrollment() {
        CourseSection section = findEligibleSection(testStudent);
        assertNotNull(section);

        // Enroll
        enrollmentService.enrollStudent(testStudent.getId(), section.getId());
        Enrollment first = enrollmentRepository
                .findByStudentIdAndSectionId(testStudent.getId(), section.getId())
                .orElseThrow();

        // Drop
        enrollmentService.dropEnrollment(first.getId());
        assertEquals("dropped", enrollmentRepository.findById(first.getId()).orElseThrow().getStatus());

        // Re-enroll
        EnrollmentResponseDTO response = enrollmentService.enrollStudent(
                testStudent.getId(), section.getId());

        assertTrue(response.isSuccess(), "Re-enrollment should succeed: " + response.getErrors());
    }

    // --- Helper methods ---

    private CourseSection findEligibleSection(Student student) {
        return courseSectionRepository.findBySemesterIdWithDetails(activeSemester.getId())
                .stream()
                .filter(cs -> student.getGradeLevel() >= cs.getCourse().getGradeLevelMin()
                        && student.getGradeLevel() <= cs.getCourse().getGradeLevelMax())
                .filter(cs -> cs.getCourse().getPrerequisite() == null
                        || historyRepository.existsByStudentIdAndCourseIdAndStatus(
                                student.getId(), cs.getCourse().getPrerequisite().getId(), "passed"))
                .filter(cs -> !cs.getMeetings().isEmpty())
                .findFirst()
                .orElse(null);
    }

    private CourseSection createTestSection(String code, String name, TimeSlot slot) {
        Course course = new Course();
        course.setCode(code);
        course.setName(name);
        course.setCredits(new BigDecimal("3.0"));
        course.setHoursPerWeek(3);
        course.setSpecialization(spec);
        course.setCourseType("elective");
        course.setGradeLevelMin(9);
        course.setGradeLevelMax(12);
        course.setSemesterOrder(activeSemester.getOrderInYear());
        course.setCreatedAt(LocalDateTime.now());
        courseRepository.save(course);

        CourseSection section = new CourseSection();
        section.setSemester(activeSemester);
        section.setCourse(course);
        section.setTeacher(teacher);
        section.setSectionLabel("A");
        section.setCreatedAt(LocalDateTime.now());
        courseSectionRepository.save(section);

        SectionMeeting meeting = new SectionMeeting();
        meeting.setSection(section);
        meeting.setClassroom(classroom);
        meeting.setTimeslot(slot);
        sectionMeetingRepository.save(meeting);

        entityManager.flush();
        entityManager.clear();
        return courseSectionRepository.findByIdWithDetails(section.getId()).orElseThrow();
    }

    private CourseSection createConflictingSection(CourseSection existingSection) {
        // Use the same timeslot as the existing section
        TimeSlot conflictSlot = existingSection.getMeetings().get(0).getTimeslot();
        return createTestSection("CONF01", "Conflicting Course", conflictSlot);
    }

    private CourseSection createSectionWithPrerequisite() {
        // Create a prerequisite course
        Course prereq = new Course();
        prereq.setCode("PRQ001");
        prereq.setName("Prerequisite Course");
        prereq.setCredits(new BigDecimal("3.0"));
        prereq.setHoursPerWeek(3);
        prereq.setSpecialization(spec);
        prereq.setCourseType("core");
        prereq.setGradeLevelMin(9);
        prereq.setGradeLevelMax(12);
        prereq.setSemesterOrder(activeSemester.getOrderInYear());
        prereq.setCreatedAt(LocalDateTime.now());
        courseRepository.save(prereq);

        // Create course that requires it
        Course course = new Course();
        course.setCode("ADV001");
        course.setName("Advanced Course");
        course.setCredits(new BigDecimal("3.0"));
        course.setHoursPerWeek(3);
        course.setSpecialization(spec);
        course.setPrerequisite(prereq);
        course.setCourseType("core");
        course.setGradeLevelMin(9);
        course.setGradeLevelMax(12);
        course.setSemesterOrder(activeSemester.getOrderInYear());
        course.setCreatedAt(LocalDateTime.now());
        courseRepository.save(course);

        TimeSlot slot = timeSlotRepository.findAll().get(15); // Use a distant slot
        return createTestSectionForCourse(course, slot);
    }

    private CourseSection createTestSectionForCourse(Course course, TimeSlot slot) {
        CourseSection section = new CourseSection();
        section.setSemester(activeSemester);
        section.setCourse(course);
        section.setTeacher(teacher);
        section.setSectionLabel("A");
        section.setCreatedAt(LocalDateTime.now());
        courseSectionRepository.save(section);

        SectionMeeting meeting = new SectionMeeting();
        meeting.setSection(section);
        meeting.setClassroom(classroom);
        meeting.setTimeslot(slot);
        sectionMeetingRepository.save(meeting);

        entityManager.flush();
        entityManager.clear();
        return courseSectionRepository.findByIdWithDetails(section.getId()).orElseThrow();
    }
}
