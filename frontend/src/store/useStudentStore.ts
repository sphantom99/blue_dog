import { create } from "zustand";
import { studentsApi } from "../api/client";
import type { StudentProfile } from "../types";

interface StudentState {
    studentId: number | null;
    profile: StudentProfile | null;
    loading: boolean;
    error: string | null;

    setStudentId: (id: number) => void;
    fetchProfile: (id: number) => Promise<void>;
    logout: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
    studentId: null,
    profile: null,
    loading: false,
    error: null,

    setStudentId: (id) => set({ studentId: id }),

    fetchProfile: async (id) => {
        set({ loading: true, error: null });
        try {
            const { data } = await studentsApi.getProfile(id);
            set({ profile: data, studentId: id, loading: false });
        } catch {
            set({ error: "Failed to load student profile", loading: false });
        }
    },

    logout: () =>
        set({ studentId: null, profile: null, error: null }),
}));
