import { useMemo } from "react";
import { DAY_NAMES } from "../lib/dayNames";
import { useCourseStore } from "../store/useCourseStore";
import type { CourseSection } from "../types";

interface SectionCardProps {
	section: CourseSection;
	courseAlreadyEnrolled: boolean;
}

export default function SectionCard({
	section,
	courseAlreadyEnrolled,
}: SectionCardProps) {
	const {
		pendingEnrollments,
		conflictingSlotIds,
		schedule,
		addToPending,
		removeFromPending,
	} = useCourseStore();

	const isFull = section.enrolledCount >= section.capacity;
	const isPending = pendingEnrollments.some((s) => s.id === section.id);

	// Slot IDs currently booked (enrolled + pending).
	const bookedSlotIds = useMemo(() => {
		const ids = new Set<number>();
		for (const s of [
			...(schedule?.enrolledSections ?? []),
			...pendingEnrollments,
		]) {
			for (const m of s.meetings) ids.add(m.timeslot.id);
		}
		return ids;
	}, [schedule, pendingEnrollments]);

	// This pending section overlaps with another booked slot.
	const isConflicting =
		isPending &&
		section.meetings.some((m) => conflictingSlotIds.has(m.timeslot.id));

	// This un-added section would conflict if added.
	const wouldConflict =
		!isPending &&
		!courseAlreadyEnrolled &&
		!isFull &&
		section.meetings.some((m) => bookedSlotIds.has(m.timeslot.id));

	const handleToggle = () => {
		if (isPending) {
			removeFromPending(section.id);
		} else {
			addToPending(section);
		}
	};

	const meetingText = section.meetings
		.map((m) => {
			const day = DAY_NAMES[m.timeslot.dayOfWeek] || "?";
			const start = m.timeslot.startTime.slice(0, 5);
			return `${day} ${start}`;
		})
		.join(", ");

	let buttonLabel: string;
	let buttonStyle: string;
	let buttonDisabled = false;

	if (courseAlreadyEnrolled) {
		buttonLabel = "Enrolled";
		buttonStyle =
			"bg-green-100 text-green-700 border border-green-300 cursor-not-allowed";
		buttonDisabled = true;
	} else if (isFull && !isPending) {
		buttonLabel = "Full";
		buttonStyle =
			"bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed";
		buttonDisabled = true;
	} else if (isPending && isConflicting) {
		buttonLabel = "⚠ Pending ✕";
		buttonStyle =
			"bg-red-100 text-red-700 hover:bg-red-200 border border-red-300";
	} else if (isPending) {
		buttonLabel = "Pending ✕";
		buttonStyle =
			"bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300";
	} else {
		buttonLabel = "Add";
		buttonStyle = "bg-indigo-600 text-white hover:bg-indigo-700";
	}

	// Border style: red when conflicting, normal otherwise
	const cardBorder = isConflicting
		? "border-red-300 bg-red-50"
		: isFull || courseAlreadyEnrolled
			? "border-gray-100 opacity-70"
			: wouldConflict
				? "border-amber-300 bg-amber-50"
				: "border-gray-200";

	return (
		<div
			className={`bg-white rounded-lg border p-3 flex flex-col gap-2 ${cardBorder}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-gray-900">
							Section {section.sectionLabel}
						</span>
						<span className="text-xs text-gray-400">
							{section.teacherFirstName} {section.teacherLastName}
						</span>
					</div>
					<p className="text-xs text-gray-500 mt-0.5">{meetingText}</p>
					<p
						className={`text-xs mt-0.5 ${isFull ? "text-red-500 font-medium" : "text-gray-400"}`}
					>
						{section.enrolledCount}/{section.capacity} enrolled
					</p>
				</div>
				<button
					type="button"
					onClick={handleToggle}
					disabled={buttonDisabled}
					className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${buttonStyle}`}
				>
					{buttonLabel}
				</button>
			</div>
			{/* Conflict warning banners */}
			{isConflicting && (
				<p className="text-xs text-red-600 font-medium flex items-center gap-1">
					<span aria-hidden="true">⚠</span> Time conflict with another added
					course
				</p>
			)}
			{wouldConflict && (
				<p className="text-xs text-amber-600 font-medium flex items-center gap-1">
					<span aria-hidden="true">⚠</span> Overlaps with your current schedule
				</p>
			)}
		</div>
	);
}
