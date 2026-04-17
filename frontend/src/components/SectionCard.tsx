import { useMemo } from "react";
import { formatMeetingTimes } from "../lib/formatMeetingTime";
import { useCourseStore } from "../store/useCourseStore";
import type { CourseSection } from "../types";
import { Button } from "./ui";

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

	const meetingText = formatMeetingTimes(section.meetings);

	// Determine button appearance
	let buttonLabel: string;
	let buttonVariant: "ghost" | "primary" | "danger";
	let buttonDisabled = false;

	if (courseAlreadyEnrolled) {
		buttonLabel = "Enrolled";
		buttonVariant = "ghost";
		buttonDisabled = true;
	} else if (isFull && !isPending) {
		buttonLabel = "Full";
		buttonVariant = "ghost";
		buttonDisabled = true;
	} else if (isPending && isConflicting) {
		buttonLabel = "⚠ Pending ✕";
		buttonVariant = "danger";
	} else if (isPending) {
		buttonLabel = "Pending ✕";
		buttonVariant = "danger";
	} else {
		buttonLabel = "Add";
		buttonVariant = "primary";
	}

	// Card border / background based on conflict state
	const cardBorder = isConflicting
		? "border-danger-300 bg-danger-50"
		: isFull || courseAlreadyEnrolled
			? "border-border-muted opacity-70"
			: wouldConflict
				? "border-warning-100 bg-warning-50"
				: "border-border";

	return (
		<div
			className={`bg-surface rounded-lg border p-3 flex flex-col gap-2 ${cardBorder}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-text-base">
							Section {section.sectionLabel}
						</span>
						<span className="text-xs text-text-subtle">
							{section.teacherFirstName} {section.teacherLastName}
						</span>
					</div>
					<p className="text-xs text-text-muted mt-0.5">{meetingText}</p>
					<p
						className={`text-xs mt-0.5 ${isFull ? "text-danger-500 font-medium" : "text-text-subtle"}`}
					>
						{section.enrolledCount}/{section.capacity} enrolled
					</p>
				</div>
				<Button
					size="sm"
					variant={buttonVariant}
					disabled={buttonDisabled}
					onClick={handleToggle}
					className="shrink-0 rounded-lg"
				>
					{buttonLabel}
				</Button>
			</div>
			{isConflicting && (
				<p className="text-xs text-danger-600 font-medium flex items-center gap-1">
					<span aria-hidden="true">⚠</span> Time conflict with another added course
				</p>
			)}
			{wouldConflict && (
				<p className="text-xs text-warning-600 font-medium flex items-center gap-1">
					<span aria-hidden="true">⚠</span> Overlaps with your current schedule
				</p>
			)}
		</div>
	);
}
