import { create } from "zustand";
import {
    coursesApi,
    enrollmentsApi,
    sectionsApi,
    semestersApi,
    studentsApi,
} from "../api/client";
import type {
    Course,
    CourseSection,
    EnrollmentResponse,
    Schedule,
    Semester,
    ValidationError,
} from "../types";

interface CourseState {
    // Catalog
    courses: Course[];
    coursesLoading: boolean;
    coursesError: string | null;

    // Sections for a specific course
    sections: CourseSection[];
    sectionsLoading: boolean;

    // Active semester
    activeSemester: Semester | null;

    // Current schedule (enrolled sections)
    schedule: Schedule | null;
    scheduleLoading: boolean;

    // Computed conflict tracking — timeslot IDs that appear in 2+ enrolled sections
    conflictingSlotIds: Set<number>;

    // Enrollment feedback
    enrollmentErrors: ValidationError[];
    enrolling: boolean;

    // Actions
    fetchActiveSemester: () => Promise<void>;
    fetchCourses: (params?: {
        gradeLevel?: number;
        semester?: number;
    }) => Promise<void>;
    fetchSections: (courseId: number) => Promise<void>;
    fetchAllSections: (semesterId: number) => Promise<void>;
    fetchSchedule: (studentId: number) => Promise<void>;
    enroll: (
        studentId: number,
        sectionId: number,
    ) => Promise<EnrollmentResponse>;
    drop: (
        studentId: number,
        enrollmentId: number,
    ) => Promise<EnrollmentResponse>;
    clearEnrollmentErrors: () => void;
}

function computeConflicts(schedule: Schedule | null): Set<number> {
    if (!schedule) return new Set();
    const slotCounts = new Map<number, number>();
    for (const section of schedule.enrolledSections) {
        for (const meeting of section.meetings) {
            const id = meeting.timeslot.id;
            slotCounts.set(id, (slotCounts.get(id) ?? 0) + 1);
        }
    }
    const conflicts = new Set<number>();
    for (const [id, count] of slotCounts) {
        if (count > 1) conflicts.add(id);
    }
    return conflicts;
}

export const useCourseStore = create<CourseState>((set, get) => ({
    courses: [],
    coursesLoading: false,
    coursesError: null,

    sections: [],
    sectionsLoading: false,

    activeSemester: null,

    schedule: null,
    scheduleLoading: false,

    conflictingSlotIds: new Set(),

    enrollmentErrors: [],
    enrolling: false,

    fetchActiveSemester: async () => {
        try {
            const { data } = await semestersApi.getActive();
            set({ activeSemester: data });
        } catch {
            console.error("Failed to fetch active semester");
        }
    },

    fetchCourses: async (params) => {
        set({ coursesLoading: true, coursesError: null });
        try {
            const { data } = await coursesApi.getAll(params);
            set({ courses: data, coursesLoading: false });
        } catch {
            set({
                coursesError: "Failed to load courses",
                coursesLoading: false,
            });
        }
    },

    fetchSections: async (courseId) => {
        set({ sectionsLoading: true });
        try {
            const { data } = await coursesApi.getSections(courseId);
            set({ sections: data, sectionsLoading: false });
        } catch {
            set({ sections: [], sectionsLoading: false });
        }
    },

    fetchAllSections: async (semesterId) => {
        set({ sectionsLoading: true });
        try {
            const { data } = await sectionsApi.getAll(semesterId);
            set({ sections: data, sectionsLoading: false });
        } catch {
            set({ sections: [], sectionsLoading: false });
        }
    },

    fetchSchedule: async (studentId) => {
        set({ scheduleLoading: true });
        try {
            const { data } = await studentsApi.getSchedule(studentId);
            set({
                schedule: data,
                scheduleLoading: false,
                conflictingSlotIds: computeConflicts(data),
            });
        } catch {
            set({ scheduleLoading: false });
        }
    },

    enroll: async (studentId, sectionId) => {
        set({ enrolling: true, enrollmentErrors: [] });
        try {
            const { data } = await enrollmentsApi.enroll(studentId, sectionId);
            if (!data.success) {
                set({ enrollmentErrors: data.errors, enrolling: false });
                return data;
            }
            // Re-fetch schedule to sync with server
            await get().fetchSchedule(studentId);
            set({ enrolling: false });
            return data;
        } catch (err: unknown) {
            // 400 responses carry the validation errors in the response body
            if (
                err &&
                typeof err === "object" &&
                "response" in err &&
                (err as { response?: { data?: EnrollmentResponse } }).response
                    ?.data
            ) {
                const data = (
                    err as { response: { data: EnrollmentResponse } }
                ).response.data;
                set({
                    enrollmentErrors: data.errors ?? [],
                    enrolling: false,
                });
                return data;
            }
            set({
                enrollmentErrors: [
                    { code: "NETWORK_ERROR", message: "Failed to enroll" },
                ],
                enrolling: false,
            });
            return { success: false, errors: get().enrollmentErrors };
        }
    },

    drop: async (studentId, enrollmentId) => {
        set({ enrolling: true, enrollmentErrors: [] });
        try {
            const { data } = await enrollmentsApi.drop(enrollmentId);
            if (!data.success) {
                set({ enrollmentErrors: data.errors, enrolling: false });
                return data;
            }
            // Re-fetch schedule to sync with server
            await get().fetchSchedule(studentId);
            set({ enrolling: false });
            return data;
        } catch (err: unknown) {
            if (
                err &&
                typeof err === "object" &&
                "response" in err &&
                (err as { response?: { data?: EnrollmentResponse } }).response
                    ?.data
            ) {
                const data = (
                    err as { response: { data: EnrollmentResponse } }
                ).response.data;
                set({
                    enrollmentErrors: data.errors ?? [],
                    enrolling: false,
                });
                return data;
            }
            set({
                enrollmentErrors: [
                    { code: "NETWORK_ERROR", message: "Failed to drop course" },
                ],
                enrolling: false,
            });
            return { success: false, errors: get().enrollmentErrors };
        }
    },

    clearEnrollmentErrors: () => set({ enrollmentErrors: [] }),
}));
