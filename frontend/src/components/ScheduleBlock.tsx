import type { CourseSection } from "../types";
import { useCourseStore } from "../store/useCourseStore";

interface ScheduleBlockProps {
	section: CourseSection;
	timeslotId: number;
	studentId: number;
	isConflict: boolean;
}

export default function ScheduleBlock({
	section,
	timeslotId,
	studentId,
	isConflict,
}: ScheduleBlockProps) {
	const { drop, enrolling } = useCourseStore();

	const meeting = section.meetings.find(
		(m) => m.timeslot.id === timeslotId,
	);

	const handleDrop = async () => {
		if (!section.enrollmentId) return;
		await drop(studentId, section.enrollmentId);
	};

	return (
		<div
			className={`relative rounded-lg px-2 py-1.5 text-xs h-full flex flex-col justify-between overflow-hidden group ${
				isConflict
					? "bg-red-100 border-2 border-red-400 text-red-900"
					: "bg-indigo-100 border border-indigo-300 text-indigo-900"
			}`}
			title={
				isConflict
					? `⚠ Time conflict — ${section.courseCode} ${section.sectionLabel}`
					: `${section.courseCode}-${section.sectionLabel}`
			}
		>
			<div>
				<p className="font-semibold truncate">
					{section.courseCode}-{section.sectionLabel}
				</p>
				<p className="truncate">{section.courseName}</p>
				{meeting && (
					<p className="text-[10px] opacity-70 truncate">
						{meeting.classroomName}
					</p>
				)}
			</div>
			<button
				type="button"
				onClick={handleDrop}
				disabled={enrolling}
				className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-white/80 hover:bg-red-200 text-gray-600 hover:text-red-700 flex items-center justify-center text-xs font-bold transition-opacity"
				aria-label={`Drop ${section.courseCode}`}
			>
				×
			</button>
		</div>
	);
}
