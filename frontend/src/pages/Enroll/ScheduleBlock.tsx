
// Color palette keyed by specialization name

import { SUBJECT_COLORS } from "../../lib/specializationColors";
import { useCourseStore } from "../../store/useCourseStore";
import type { CourseSection } from "../../types";

const DEFAULT_COLOR = {
	bg: "bg-primary-100",
	border: "border-primary-400",
	text: "text-primary-900",
	pendingBorder: "border-primary-500",
};

interface ScheduleBlockProps {
	section: CourseSection;
	timeslotId: number;
	studentId: number;
	isConflict: boolean;
	isPending?: boolean;
}

export default function ScheduleBlock({
	section,
	timeslotId,
	studentId,
	isConflict,
	isPending = false,
}: ScheduleBlockProps) {
	const { drop, dropping, removeFromPending } = useCourseStore();

	const meeting = section.meetings.find((m) => m.timeslot.id === timeslotId);
	const colors =
		(section.specialization && SUBJECT_COLORS[section.specialization]) ||
		DEFAULT_COLOR;

	const handleAction = async () => {
		if (isPending) {
			removeFromPending(section.id);
		} else {
			if (!section.enrollmentId) return;
			await drop(studentId, section.enrollmentId);
		}
	};

	let containerClass: string;
	if (isConflict) {
		containerClass = "bg-danger-100 border-2 border-danger-400 text-danger-900 w-[50%]";
	} else if (isPending) {
		containerClass = `${colors.bg} border-2 border-dashed ${colors.pendingBorder} ${colors.text}`;
	} else {
		containerClass = `${colors.bg} border ${colors.border} ${colors.text}`;
	}

	return (
		<div
			className={`relative rounded-lg px-2 py-1 text-xs h-full max-h-full overflow-hidden flex flex-col group ${containerClass}`}
			title={
				isConflict
					? `⚠ Time conflict — ${section.courseCode} ${section.sectionLabel}`
					: `${section.courseCode}-${section.sectionLabel}${isPending ? " (pending)" : ""}`
			}
		>
			{/* X button — top-left for pending (always visible), top-right for enrolled (hover) */}
			<button
				type="button"
				onClick={handleAction}
				disabled={!isPending && dropping}
				className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-opacity ${
					isPending
						? "top-1 left-1 bg-surface text-pending-700 border border-pending-400 hover:bg-danger-100 hover:text-danger-700 hover:border-danger-400 shadow-sm text-center align-center"
						: "top-1 right-1 bg-surface/80 hover:bg-danger-200 text-text-muted hover:text-danger-700 opacity-0 group-hover:opacity-100"
				}`}
				aria-label={`${isPending ? "Remove" : "Drop"} ${section.courseCode}`}
			>
				×
			</button>
			<p
				className={`font-semibold truncate leading-tight ${isPending ? "pl-5" : ""}`}
			>
				{section.courseCode}-{section.sectionLabel}
			</p>
			<p className="truncate leading-tight">{section.courseName}</p>
			{meeting && (
				<p className="text-[10px] opacity-60 truncate leading-tight">
					{meeting.classroomName}
				</p>
			)}
		</div>
	);
}
