import { useState } from "react";
import { useCourseStore } from "../store/useCourseStore";
import type { Course } from "../types";
import SectionCard from "./SectionCard";

interface CourseCardProps {
	course: Course;
	passedCourseIds: Set<number>;
}

export default function CourseCard({
	course,
	passedCourseIds,
}: CourseCardProps) {
	const [expanded, setExpanded] = useState(false);
	const {
		sectionsByCourseId,
		sectionsLoadingFor,
		fetchSections,
		schedule,
		pendingEnrollments,
	} = useCourseStore();

	const sections = sectionsByCourseId[course.id] ?? [];
	const loading = sectionsLoadingFor.has(course.id);

	const hasUnmetPrereq =
		course.prerequisiteId !== null &&
		!passedCourseIds.has(course.prerequisiteId);

	// Already enrolled in this course (any section)
	const alreadyEnrolled = !!schedule?.enrolledSections.some(
		(s) => s.courseId === course.id,
	);

	// Any section of this course staged for enrollment
	const hasPending = pendingEnrollments.some((s) => s.courseId === course.id);

	const handleExpand = () => {
		if (!expanded) {
			fetchSections(course.id);
		}
		setExpanded(!expanded);
	};

	return (
		<div
			className={`border rounded-lg overflow-hidden transition-colors ${
				hasUnmetPrereq
					? "border-gray-200 bg-gray-50 opacity-60"
					: "border-gray-200 bg-white hover:border-indigo-300"
			}`}
		>
			{/* Accordion header — always clickable, even when grayed out */}
			<button
				type="button"
				onClick={handleExpand}
				className="w-full text-left p-4 flex items-center justify-between cursor-pointer"
			>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="font-mono text-sm font-semibold text-indigo-600">
							{course.code}
						</span>
						<span className="text-sm text-gray-400">{course.credits} cr</span>
						{course.courseType === "core" && (
							<span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium uppercase">
								Core
							</span>
						)}
						{alreadyEnrolled && (
							<span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
								Enrolled
							</span>
						)}
						{hasPending && !alreadyEnrolled && (
							<span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
								Pending
							</span>
						)}
					</div>
					<p className="text-sm text-gray-900 mt-0.5 truncate">{course.name}</p>
					{hasUnmetPrereq && (
						<p className="text-xs text-red-500 mt-1">
							Requires: {course.prerequisiteCode}
						</p>
					)}
				</div>
				<span className="text-gray-400 ml-2 text-lg shrink-0">
					{expanded ? "▾" : "▸"}
				</span>
			</button>

			{expanded && (
				<div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
					{hasUnmetPrereq && (
						<p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
							Prerequisite not met: complete{" "}
							<span className="font-semibold">{course.prerequisiteCode}</span>{" "}
							first
						</p>
					)}
					{loading && sections.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-2">
							Loading sections...
						</p>
					) : sections.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-2">
							No sections available
						</p>
					) : (
						sections.map((section) => (
							<SectionCard
								key={section.id}
								section={section}
								courseAlreadyEnrolled={alreadyEnrolled}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}
