import { describe, it, expect } from "vitest";
import { formatMeetingTime, formatMeetingTimes } from "./formatMeetingTime";
import type { SectionMeeting } from "../types";

const makeMeeting = (dayOfWeek: number, startTime: string): SectionMeeting => ({
  id: 1,
  classroomName: "Room 101",
  classroomCapacity: 30,
  timeslot: { id: 1, dayOfWeek, startTime, endTime: "09:00:00" },
});

describe("formatMeetingTime", () => {
  it("formats a Monday meeting", () => {
    expect(formatMeetingTime(makeMeeting(1, "08:00:00"))).toBe("Mon 08:00");
  });

  it("formats a Friday meeting", () => {
    expect(formatMeetingTime(makeMeeting(5, "14:30:00"))).toBe("Fri 14:30");
  });

  it("returns ? for unknown day", () => {
    expect(formatMeetingTime(makeMeeting(9, "08:00:00"))).toBe("? 08:00");
  });
});

describe("formatMeetingTimes", () => {
  it("joins multiple meetings with comma", () => {
    const meetings = [
      makeMeeting(1, "08:00:00"),
      makeMeeting(3, "10:00:00"),
    ];
    expect(formatMeetingTimes(meetings)).toBe("Mon 08:00, Wed 10:00");
  });

  it("returns empty string for no meetings", () => {
    expect(formatMeetingTimes([])).toBe("");
  });
});
