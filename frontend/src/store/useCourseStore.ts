import { create } from "zustand";
import {
    coursesApi,
    enrollmentsApi,
    sectionsApi,
    semestersApi,
    studentsApi,
} from "../api/client";
import { showToast } from "../lib/toastService";
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

    // Sections keyed by course id — each course's sections are cached
    // independently so expanding a second course doesn't stomp the first.
    sectionsByCourseId: Record<number, CourseSection[]>;
    sectionsLoadingFor: Set<number>;

    // Active semester
    activeSemester: Semester | null;

    // Current schedule (enrolled sections)
    schedule: Schedule | null;
    scheduleLoading: boolean;

    // Pending enrollments — staged but not yet committed
    pendingEnrollments: CourseSection[];
    pendingLoading: boolean;

    // Timeslot IDs appearing in 2+ sections (enrolled + pending combined).
    // Purely informational — used to paint blocks red. The server is still
    // the source of truth on commit.
    conflictingSlotIds: Set<number>;

    // Drop feedback (drops are still immediate — not staged)
    enrollmentErrors: ValidationError[];
    dropping: boolean;

    // Actions
    fetchActiveSemester: () => Promise<void>;
    fetchCourses: (params?: {
        gradeLevel?: number;
        semester?: number;
    }) => Promise<void>;
    fetchSections: (courseId: number) => Promise<void>;
    fetchAllSections: (semesterId: number) => Promise<void>;
    fetchSchedule: (studentId: number) => Promise<void>;

    // Pending enrollment actions — no client-side validation, just staging.
    // Conflicts are shown visually; the server is the source of truth on save.
    addToPending: (section: CourseSection) => void;
    removeFromPending: (sectionId: number) => void;
    cancelPending: () => void;
    commitPending: (studentId: number) => Promise<void>;

    // Direct drop (immediate, no staging)
    drop: (
        studentId: number,
        enrollmentId: number,
    ) => Promise<EnrollmentResponse>;

    clearEnrollmentErrors: () => void;
}

function computeConflicts(
    schedule: Schedule | null,
    pending: CourseSection[],
): Set<number> {
    const slotCounts = new Map<number, number>();
    const allSections = [...(schedule?.enrolledSections ?? []), ...pending];
    for (const section of allSections) {
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

    sectionsByCourseId: {},
    sectionsLoadingFor: new Set(),

    activeSemester: null,

    schedule: null,
    scheduleLoading: false,

    pendingEnrollments: [],
    pendingLoading: false,

    conflictingSlotIds: new Set(),

    enrollmentErrors: [],
    dropping: false,

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
        // Don't re-fetch if already cached
        if (get().sectionsByCourseId[courseId]) return;

        const loading = new Set(get().sectionsLoadingFor);
        loading.add(courseId);
        set({ sectionsLoadingFor: loading });

        try {
            const { data } = await coursesApi.getSections(courseId);
            const nextLoading = new Set(get().sectionsLoadingFor);
            nextLoading.delete(courseId);
            set((state) => ({
                sectionsByCourseId: {
                    ...state.sectionsByCourseId,
                    [courseId]: data,
                },
                sectionsLoadingFor: nextLoading,
            }));
        } catch {
            const nextLoading = new Set(get().sectionsLoadingFor);
            nextLoading.delete(courseId);
            set({ sectionsLoadingFor: nextLoading });
        }
    },

    fetchAllSections: async (semesterId) => {
        try {
            const { data } = await sectionsApi.getAll(semesterId);
            // Group by courseId
            const grouped: Record<number, CourseSection[]> = {};
            for (const s of data) {
                if (!grouped[s.courseId]) grouped[s.courseId] = [];
                grouped[s.courseId].push(s);
            }
            set((state) => ({
                sectionsByCourseId: {
                    ...state.sectionsByCourseId,
                    ...grouped,
                },
            }));
        } catch {
            console.error("Failed to fetch sections for semester", semesterId);
        }
    },

    fetchSchedule: async (studentId) => {
        set({ scheduleLoading: true });
        try {
            const { data } = await studentsApi.getSchedule(studentId);
            const pending = get().pendingEnrollments;
            set({
                schedule: data,
                scheduleLoading: false,
                conflictingSlotIds: computeConflicts(data, pending),
            });
        } catch {
            set({ scheduleLoading: false });
        }
    },

    // ── Pending enrollment actions — no client-side validation ─────────────

    addToPending: (section: CourseSection) => {
        const { schedule, pendingEnrollments } = get();

        // Idempotent: already in pending → no-op (toggle handled by caller)
        if (pendingEnrollments.some((s) => s.id === section.id)) return;

        // UI guardrail: prevent adding when already enrolled in this course.
        // This isn't "validation" — the UI button is disabled anyway — but
        // double-check so programmatic calls don't create confusing state.
        if (
            schedule?.enrolledSections.some(
                (s) => s.courseId === section.courseId,
            )
        ) {
            return;
        }

        const newPending = [...pendingEnrollments, section];
        set({
            pendingEnrollments: newPending,
            conflictingSlotIds: computeConflicts(schedule, newPending),
        });
    },

    removeFromPending: (sectionId: number) => {
        const { schedule, pendingEnrollments } = get();
        const newPending = pendingEnrollments.filter((s) => s.id !== sectionId);
        set({
            pendingEnrollments: newPending,
            conflictingSlotIds: computeConflicts(schedule, newPending),
        });
    },

    cancelPending: () => {
        const { schedule } = get();
        set({
            pendingEnrollments: [],
            conflictingSlotIds: computeConflicts(schedule, []),
        });
    },

    commitPending: async (studentId: number) => {
        const { pendingEnrollments } = get();
        if (pendingEnrollments.length === 0) return;
        set({ pendingLoading: true });

        let successCount = 0;
        const stillPending: CourseSection[] = [];

        // Quick client-side conflict check before attempting enrollments. This is just a UX improvement — the server is still the source of truth and will reject conflicts — but it can save time and reduce confusion by catching issues upfront.
        if (computeConflicts(get().schedule, pendingEnrollments).size > 0) {
            showToast(
                "error",
                "Schedule conflict",
                "You have time conflicts in your pending enrollments. Please resolve them before committing.",
            );
            set({ pendingLoading: false });
            return;
        }

        for (const section of pendingEnrollments) {
            try {
                const { data } = await enrollmentsApi.enroll(
                    studentId,
                    section.id,
                );
                if (data.success) {
                    successCount++;
                } else {
                    stillPending.push(section);
                    for (const err of data.errors) {
                        showToast(
                            "error",
                            `${section.courseCode}: ${err.code.replace(/_/g, " ")}`,
                            err.message,
                        );
                    }
                }
            } catch (err: unknown) {
                stillPending.push(section);
                const axiosErr = err as {
                    response?: { data?: EnrollmentResponse };
                };
                const data = axiosErr.response?.data;
                if (data?.errors) {
                    for (const e of data.errors) {
                        showToast(
                            "error",
                            `${section.courseCode}: ${e.code.replace(/_/g, " ")}`,
                            e.message,
                        );
                    }
                } else {
                    showToast(
                        "error",
                        "Enrollment failed",
                        `Could not enroll in ${section.courseCode}`,
                    );
                }
            }
        }

        // Re-fetch schedule to pick up newly-committed enrollments
        const { data: newSchedule } = await studentsApi.getSchedule(studentId);
        set({
            schedule: newSchedule,
            pendingEnrollments: stillPending,
            pendingLoading: false,
            conflictingSlotIds: computeConflicts(newSchedule, stillPending),
        });

        if (successCount > 0) {
            showToast(
                "success",
                `Enrolled in ${successCount} course${successCount > 1 ? "s" : ""}`,
            );
        }
    },

    // ── Immediate drop (no staging) ────────────────────────────────────────

    drop: async (studentId, enrollmentId) => {
        set({ dropping: true, enrollmentErrors: [] });
        try {
            const { data } = await enrollmentsApi.drop(enrollmentId);
            if (!data.success) {
                set({ enrollmentErrors: data.errors, dropping: false });
                for (const err of data.errors) {
                    showToast("error", err.code.replace(/_/g, " "), err.message);
                }
                return data;
            }
            await get().fetchSchedule(studentId);
            showToast("success", "Course dropped");
            set({ dropping: false });
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
                    dropping: false,
                });
                return data;
            }
            set({
                enrollmentErrors: [
                    { code: "NETWORK_ERROR", message: "Failed to drop course" },
                ],
                dropping: false,
            });
            return { success: false, errors: get().enrollmentErrors };
        }
    },

    clearEnrollmentErrors: () => set({ enrollmentErrors: [] }),
}));
