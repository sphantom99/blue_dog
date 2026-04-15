export interface Course {
    id: number;
    code: string;
    name: string;
    description: string;
    credits: number;
    hoursPerWeek: number;
    prerequisiteId: number | null;
    courseType: 'core' | 'elective';
    gradeLevel: {
        min: number;
        max: number;
    };
    semesterOrder: number;
    specialization: string;
}

export interface Student {
    id: number;
    firstName: string;
    lastName: string;
    gradeLevel: number;
    email: string;
    status: string;
}

export interface StudentProfile extends Student {
    gpa: number;
    creditsEarned: number;
    totalCreditsAttempted: number;
    courseHistory: CourseHistory[];
}

export interface CourseHistory {
    id: number;
    courseId: number;
    courseCode: string;
    courseName: string;
    credits: number;
    semesterId: number;
    semesterName: string;
    status: 'passed' | 'failed';
}

export interface Semester {
    id: number;
    name: string;
    year: number;
    orderInYear: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface TimeSlot {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export interface CourseSection {
    id: number;
    courseId: number;
    courseCode: string;
    courseName: string;
    credits: number;
    sectionLabel: string;
    teacherName: string;
    semesterId: number;
    meetings: SectionMeeting[];
    enrolledCount: number;
    capacity: number;
}

export interface SectionMeeting {
    id: number;
    classroomName: string;
    timeSlot: TimeSlot;
}

export interface ScheduleEntry {
    enrollmentId: number;
    section: CourseSection;
    status: 'enrolled' | 'dropped';
}

export interface ValidationError {
    code: string;
    message: string;
}

export interface EnrollmentResponse {
    success: boolean;
    enrollmentId?: number;
    errors: ValidationError[];
}
