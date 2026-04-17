import { DAY_NAMES } from "./dayNames";
import type { SectionMeeting } from "../types";

export function formatMeetingTime(meeting: SectionMeeting): string {
  const day = DAY_NAMES[meeting.timeslot.dayOfWeek] || "?";
  const start = meeting.timeslot.startTime.slice(0, 5);
  return `${day} ${start}`;
}

export function formatMeetingTimes(meetings: SectionMeeting[]): string {
  return meetings.map(formatMeetingTime).join(", ");
}
