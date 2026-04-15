import axios from "axios";
import type {
    Course,
    CourseSection,
    EnrollmentResponse,
    Schedule,
    Semester,
    StudentProfile,
} from "../types";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error);
        return Promise.reject(error);
    },
);

export const coursesApi = {
    getAll: (params?: { gradeLevel?: number; semester?: number }) =>
        apiClient.get<Course[]>("/courses", { params }),
    getSections: (courseId: number) =>
        apiClient.get<CourseSection[]>(`/courses/${courseId}/sections`),
};

export const studentsApi = {
    getProfile: (id: number) =>
        apiClient.get<StudentProfile>(`/students/${id}`),
    getSchedule: (id: number) =>
        apiClient.get<Schedule>(`/students/${id}/schedule`),
};

export const enrollmentsApi = {
    enroll: (studentId: number, sectionId: number) =>
        apiClient.post<EnrollmentResponse>("/enrollments", {
            studentId,
            sectionId,
        }),
    drop: (enrollmentId: number) =>
        apiClient.patch<EnrollmentResponse>(`/enrollments/${enrollmentId}/drop`),
};

export const semestersApi = {
    getActive: () => apiClient.get<Semester>("/semesters/active"),
};

export const sectionsApi = {
    getAll: (semesterId: number) =>
        apiClient.get<CourseSection[]>("/sections", { params: { semesterId } }),
};
