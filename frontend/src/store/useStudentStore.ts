import { create } from "zustand";
import { studentsApi } from "../api/client";
import type { StudentProfile } from "../types";

interface StudentState {
    studentId: number | null;
    profile: StudentProfile | null;
    loading: boolean;
    error: string | null;

    graduationPct: number;

    setStudentId: (id: number) => void;
    fetchProfile: (id: number) => Promise<void>;
    logout: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
    studentId: null,
    profile: null,
    loading: false,
    error: null,
    graduationPct: 0,

    setStudentId: (id) => set({ studentId: id }),

    fetchProfile: async (id) => {
        set({ loading: true, error: null });
        try {
            const { data } = await studentsApi.getProfile(id);

            const graduationPct = data.totalCreditsRequired > 0
                ? Math.round((data.creditsPassed / data.totalCreditsRequired) * 100)
                : 0;
            set({ profile: data, studentId: id, loading: false, graduationPct });
        } catch {
            set({ error: "Failed to load student profile", loading: false });
        }
    },

    logout: () =>
        set({ studentId: null, profile: null, error: null }),
}));
