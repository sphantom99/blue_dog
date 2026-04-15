import { useCourseStore } from "../store/useCourseStore";
import type { CourseSection } from "../types";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];

interface SectionCardProps {
	section: CourseSection;
	studentId: number;
	disabled: boolean;
}

export default function SectionCard({
	section,
	studentId,
	disabled,
}: SectionCardProps) {
	const { enroll, enrolling } = useCourseStore();

	const isFull = section.enrolledCount >= section.capacity;

	const handleAdd = async () => {
		await enroll(studentId, section.id);
	};

	const meetingText = section.meetings
		.map((m) => {
			const day = DAY_NAMES[m.timeslot.dayOfWeek] || "?";
			const start = m.timeslot.startTime.slice(0, 5);
			return `${day} ${start}`;
		})
		.join(", ");

	const buttonLabel = isFull
		? "Full"
		: disabled
			? "Max"
			: enrolling
				? "..."
				: "Add";

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-3">
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
				onClick={handleAdd}
				disabled={disabled || isFull || enrolling}
				title={disabled && !isFull ? "Maximum 5 courses reached" : undefined}
				className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				{buttonLabel}
			</button>
		</div>
	);
}
