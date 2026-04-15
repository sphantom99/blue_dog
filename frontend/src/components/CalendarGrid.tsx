import type { CourseSection } from "../types";
import { useCourseStore } from "../store/useCourseStore";
import ScheduleBlock from "./ScheduleBlock";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = [8, 9, 10, 11, 13, 14]; // skip 12–13 lunch

function formatHour(h: number) {
	const suffix = h >= 12 ? "PM" : "AM";
	const display = h > 12 ? h - 12 : h;
	return `${display}:00 ${suffix}`;
}

interface CalendarGridProps {
	enrolledSections: CourseSection[];
	studentId: number;
}

export default function CalendarGrid({
	enrolledSections,
	studentId,
}: CalendarGridProps) {
	const { conflictingSlotIds } = useCourseStore();

	// Build a lookup: (dayOfWeek, startHour) -> section(s) + timeslotId
	const slotMap = new Map<
		string,
		{ section: CourseSection; timeslotId: number }[]
	>();

	for (const section of enrolledSections) {
		for (const meeting of section.meetings) {
			const ts = meeting.timeslot;
			// startTime is "HH:MM" or "HH:MM:SS"
			const hour = parseInt(ts.startTime.split(":")[0], 10);
			const key = `${ts.dayOfWeek}-${hour}`;
			if (!slotMap.has(key)) slotMap.set(key, []);
			const existing = slotMap.get(key);
			if (existing) {
				existing.push({ section, timeslotId: ts.id });
			}
		}
	}

	return (
		<div className="bg-white rounded-xl shadow overflow-hidden">
			{/* Grid header */}
			<div
				className="grid border-b border-gray-200"
				style={{
					gridTemplateColumns: "64px repeat(5, 1fr)",
				}}
			>
				<div className="p-2" />
				{DAYS.map((day) => (
					<div
						key={day}
						className="p-2 text-center text-sm font-semibold text-gray-700 border-l border-gray-200"
					>
						{day}
					</div>
				))}
			</div>

			{/* Grid body */}
			{HOURS.map((hour, rowIdx) => (
				<div
					key={hour}
					className={`grid ${rowIdx < HOURS.length - 1 ? "border-b border-gray-100" : ""}`}
					style={{
						gridTemplateColumns: "64px repeat(5, 1fr)",
						minHeight: "72px",
					}}
				>
					<div className="p-2 text-xs text-gray-400 text-right pr-3 flex items-start justify-end pt-2">
						{formatHour(hour)}
					</div>
					{DAYS.map((_, dayIdx) => {
						const dayOfWeek = dayIdx + 1; // 1=Mon
						const key = `${dayOfWeek}-${hour}`;
						const entries = slotMap.get(key) || [];

						return (
							<div
								key={key}
								className="border-l border-gray-100 p-0.5 min-h-18"
							>
								{entries.map((entry) => (
									<ScheduleBlock
										key={`${entry.section.id}-${entry.timeslotId}`}
										section={entry.section}
										timeslotId={entry.timeslotId}
										studentId={studentId}
										isConflict={conflictingSlotIds.has(
											entry.timeslotId,
										)}
									/>
								))}
							</div>
						);
					})}
				</div>
			))}

			{/* Lunch break indicator */}
			<div className="hidden">
				{/* Lunch break between 11:00 and 13:00 is simply omitted from the grid */}
			</div>
		</div>
	);
}
