import { describe, it, expect, beforeEach } from "vitest";
import { useCourseStore } from "./useCourseStore";
import type { CourseSection, Schedule } from "../types";

function makeSection(
  id: number,
  courseId: number,
  timeslotIds: number[],
): CourseSection {
  return {
    id,
    enrollmentId: null,
    courseId,
    courseCode: `COURSE${courseId}`,
    courseName: `Course ${courseId}`,
    specialization: "English",
    teacherFirstName: "John",
    teacherLastName: "Smith",
    sectionLabel: "A",
    capacity: 30,
    enrolledCount: 5,
    meetings: timeslotIds.map((tsId, i) => ({
      id: id * 100 + i,
      classroomName: "Room 101",
      classroomCapacity: 30,
      timeslot: {
        id: tsId,
        dayOfWeek: 1,
        startTime: "08:00:00",
        endTime: "09:00:00",
      },
    })),
  };
}

function makeSchedule(sections: CourseSection[]): Schedule {
  return { semesterId: 7, semesterName: "Fall", enrolledSections: sections };
}

describe("useCourseStore", () => {
  beforeEach(() => {
    useCourseStore.setState({
      courses: [],
      pendingEnrollments: [],
      schedule: null,
      conflictingSlotIds: new Set(),
    });
  });

  describe("addToPending", () => {
    it("adds a section to pending enrollments", () => {
      const section = makeSection(1, 1, [10]);
      useCourseStore.getState().addToPending(section);

      expect(useCourseStore.getState().pendingEnrollments).toHaveLength(1);
      expect(useCourseStore.getState().pendingEnrollments[0].id).toBe(1);
    });

    it("is idempotent — adding same section twice is a no-op", () => {
      const section = makeSection(1, 1, [10]);
      useCourseStore.getState().addToPending(section);
      useCourseStore.getState().addToPending(section);

      expect(useCourseStore.getState().pendingEnrollments).toHaveLength(1);
    });

    it("prevents adding when already enrolled in the same course", () => {
      const enrolled = makeSection(1, 1, [10]);
      useCourseStore.setState({ schedule: makeSchedule([enrolled]) });

      const newSection = makeSection(2, 1, [20]);
      useCourseStore.getState().addToPending(newSection);

      expect(useCourseStore.getState().pendingEnrollments).toHaveLength(0);
    });
  });

  describe("removeFromPending", () => {
    it("removes a section from pending", () => {
      const section = makeSection(1, 1, [10]);
      useCourseStore.setState({ pendingEnrollments: [section] });

      useCourseStore.getState().removeFromPending(1);

      expect(useCourseStore.getState().pendingEnrollments).toHaveLength(0);
    });
  });

  describe("cancelPending", () => {
    it("clears all pending enrollments", () => {
      const s1 = makeSection(1, 1, [10]);
      const s2 = makeSection(2, 2, [20]);
      useCourseStore.setState({ pendingEnrollments: [s1, s2] });

      useCourseStore.getState().cancelPending();

      expect(useCourseStore.getState().pendingEnrollments).toHaveLength(0);
    });
  });

  describe("conflict detection", () => {
    it("detects conflicts between pending sections", () => {
      const s1 = makeSection(1, 1, [10, 20]);
      const s2 = makeSection(2, 2, [20, 30]);

      useCourseStore.getState().addToPending(s1);
      useCourseStore.getState().addToPending(s2);

      const conflicts = useCourseStore.getState().conflictingSlotIds;
      expect(conflicts.has(20)).toBe(true);
      expect(conflicts.has(10)).toBe(false);
      expect(conflicts.has(30)).toBe(false);
    });

    it("detects conflicts between enrolled and pending", () => {
      const enrolled = makeSection(1, 1, [10]);
      useCourseStore.setState({ schedule: makeSchedule([enrolled]) });

      const pending = makeSection(2, 2, [10]);
      useCourseStore.getState().addToPending(pending);

      expect(useCourseStore.getState().conflictingSlotIds.has(10)).toBe(true);
    });

    it("clears conflicts when pending section removed", () => {
      const enrolled = makeSection(1, 1, [10]);
      useCourseStore.setState({ schedule: makeSchedule([enrolled]) });

      const pending = makeSection(2, 2, [10]);
      useCourseStore.getState().addToPending(pending);
      expect(useCourseStore.getState().conflictingSlotIds.has(10)).toBe(true);

      useCourseStore.getState().removeFromPending(2);
      expect(useCourseStore.getState().conflictingSlotIds.has(10)).toBe(false);
    });

    it("reports no conflicts when no overlapping timeslots", () => {
      const s1 = makeSection(1, 1, [10]);
      const s2 = makeSection(2, 2, [20]);

      useCourseStore.getState().addToPending(s1);
      useCourseStore.getState().addToPending(s2);

      expect(useCourseStore.getState().conflictingSlotIds.size).toBe(0);
    });
  });
});
