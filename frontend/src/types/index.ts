// Matches backend CourseDTO
export interface Course {
    id: number;
    code: string;
    name: string;
    description: string;
    credits: number;
    hoursPerWeek: number;
    specialization: string;
    courseType: string;
    gradeLevelMin: number;
    gradeLevelMax: number;
    semesterOrder: number;
    prerequisiteId: number | null;
    prerequisiteCode: string | null;
    prerequisiteName: string | null;
}

// Matches backend StudentProfileDTO
export interface StudentProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    gradeLevel: number;
    status: string;
    gpa: number;
    creditsPassed: number;
    creditsAttempted: number;
    totalCreditsRequired: number;
    courseHistory: CourseHistory[];
}

// Matches backend CourseHistoryDTO
export interface CourseHistory {
    courseId: number;
    courseCode: string;
    courseName: string;
    credits: number;
    semesterName: string;
    semesterYear: number;
    status: string;
}

// Matches backend SemesterDTO
export interface Semester {
    id: number;
    name: string;
    year: number;
    orderInYear: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

// Matches backend TimeSlotDTO
export interface TimeSlot {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

// Matches backend CourseSectionDTO
export interface CourseSection {
    id: number;
    enrollmentId: number | null;
    courseId: number;
    courseCode: string;
    courseName: string;
    specialization: string | null;
    teacherFirstName: string;
    teacherLastName: string;
    sectionLabel: string;
    capacity: number;
    enrolledCount: number;
    meetings: SectionMeeting[];
}

// Matches backend SectionMeetingDTO
export interface SectionMeeting {
    id: number;
    classroomName: string;
    classroomCapacity: number;
    timeslot: TimeSlot;
}

// Matches backend ScheduleDTO
export interface Schedule {
    semesterId: number;
    semesterName: string;
    enrolledSections: CourseSection[];
}

// Matches backend ValidationErrorDTO
export interface ValidationError {
    code: string;
    message: string;
}

// Matches backend EnrollmentResponseDTO
export interface EnrollmentResponse {
    success: boolean;
    errors: ValidationError[];
}
