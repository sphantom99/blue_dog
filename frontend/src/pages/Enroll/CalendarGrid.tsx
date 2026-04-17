import { Fragment } from "react";
import type { CourseSection } from "../../types";
import { useCourseStore } from "../../store/useCourseStore";
import ScheduleBlock from "./ScheduleBlock";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
// Teaching periods: 8–11 AM, then 12 is lunch, then 1–2 PM
const HOURS = [8, 9, 10, 11, 13, 14];

function formatHour(h: number) {
	const suffix = h >= 12 ? "PM" : "AM";
	const display = h > 12 ? h - 12 : h;
	return `${display}:00 ${suffix}`;
}

interface CalendarGridProps {
	enrolledSections: CourseSection[];
	pendingSections: CourseSection[];
	studentId: number;
}

export default function CalendarGrid({
	enrolledSections,
	pendingSections,
	studentId,
}: CalendarGridProps) {
	const { conflictingSlotIds } = useCourseStore();

	// Build a lookup: (dayOfWeek, startHour) -> entry[]
	type Entry = {
		section: CourseSection;
		timeslotId: number;
		isPending: boolean;
	};
	const slotMap = new Map<string, Entry[]>();

	const addToSlotMap = (section: CourseSection, isPending: boolean) => {
		for (const meeting of section.meetings) {
			const ts = meeting.timeslot;
			const hour = parseInt(ts.startTime.split(":")[0], 10);
			const key = `${ts.dayOfWeek}-${hour}`;
			const existing = slotMap.get(key) ?? [];
			slotMap.set(key, [
				...existing,
				{ section, timeslotId: ts.id, isPending },
			]);
		}
	};

	for (const section of enrolledSections) addToSlotMap(section, false);
	for (const section of pendingSections) addToSlotMap(section, true);

	return (
		<div className="bg-surface rounded-xl shadow overflow-hidden">
			{/* Grid header */}
			<div
				className="grid border-b border-border"
				style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}
			>
				<div className="p-2" />
				{DAYS.map((day) => (
					<div
						key={day}
						className="p-2 text-center text-sm font-semibold text-text-muted border-l border-border"
					>
						{day}
					</div>
				))}
			</div>

			{/* Grid body */}
			{HOURS.map((hour, rowIdx) => (
				<Fragment key={hour}>
					{/* Lunch break row — inserted before 1 PM */}
					{hour === 13 && (
						<div
							className="grid border-b border-border"
							style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}
						>
							<div className="p-2 text-xs text-text-subtle text-right pr-3 flex items-center justify-end">
								12:00 PM
							</div>
							<div
								className="col-span-5 flex items-center justify-center bg-warning-50 border-l border-border-muted"
								style={{ minHeight: "48px" }}
							>
								<span className="text-xs font-medium text-warning-600 tracking-wide uppercase">
									🍽 Lunch Break
								</span>
							</div>
						</div>
					)}

					{/* Regular teaching period row */}
					<div
						className={`grid ${rowIdx < HOURS.length - 1 ? "border-b border-border-muted" : ""}`}
						style={{
							gridTemplateColumns: "64px repeat(5, 1fr)",
							minHeight: "72px",
						}}
					>
						<div className="p-2 text-xs text-text-subtle text-right pr-3 flex items-start justify-end pt-2">
							{formatHour(hour)}
						</div>
						{DAYS.map((_, dayIdx) => {
							const dayOfWeek = dayIdx + 1;
							const key = `${dayOfWeek}-${hour}`;
							const entries = slotMap.get(key) || [];

							return (
								<div
									key={key}
									className="border-l border-border-muted p-0.5 h-18 overflow-hidden flex"
								>
									{entries.map((entry) => (
										<ScheduleBlock
											key={`${entry.section.id}-${entry.timeslotId}-${entry.isPending}`}
											section={entry.section}
											timeslotId={entry.timeslotId}
											studentId={studentId}
											isConflict={conflictingSlotIds.has(entry.timeslotId)}
											isPending={entry.isPending}
										/>
									))}
								</div>
							);
						})}
					</div>
				</Fragment>
			))}
		</div>
	);
}
