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
	const { pendingEnrollments, addToPending, removeFromPending } =
		useCourseStore();

	const isFull = section.enrolledCount >= section.capacity;
	const isPending = pendingEnrollments.some((s) => s.id === section.id);

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
	} else if (isPending) {
		buttonLabel = "Pending ✕";
		buttonStyle =
			"bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300";
	} else {
		buttonLabel = "Add";
		buttonStyle = "bg-indigo-600 text-white hover:bg-indigo-700";
	}

	return (
		<div
			className={`bg-white rounded-lg border p-3 flex items-center justify-between gap-3 ${
				isFull || courseAlreadyEnrolled
					? "border-gray-100 opacity-70"
					: "border-gray-200"
			}`}
		>
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
	);
}
