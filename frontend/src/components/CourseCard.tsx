import { useState } from "react";
import { useCourseStore } from "../store/useCourseStore";
import type { Course } from "../types";
import SectionCard from "./SectionCard";
import { Badge } from "./ui";

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

	const alreadyEnrolled = !!schedule?.enrolledSections.some(
		(s) => s.courseId === course.id,
	);

	const hasPending = pendingEnrollments.some((s) => s.courseId === course.id);

	const handleExpand = () => {
		if (!expanded) fetchSections(course.id);
		setExpanded(!expanded);
	};

	return (
		<div
			className={`border rounded-lg overflow-hidden transition-colors ${
				hasUnmetPrereq
					? "border-gray-200 bg-gray-50 opacity-60"
					: "border-gray-200 bg-white hover:border-primary-300"
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
						<span className="font-mono text-sm font-semibold text-primary-600">
							{course.code}
						</span>
						<span className="text-sm text-text-subtle">{course.credits} cr</span>
						{course.courseType === "core" && (
							<Badge variant="warning" className="uppercase">Core</Badge>
						)}
						{alreadyEnrolled && (
							<Badge variant="success">Enrolled</Badge>
						)}
						{hasPending && !alreadyEnrolled && (
							<Badge variant="pending">Pending</Badge>
						)}
					</div>
					<p className="text-sm text-text-base mt-0.5 truncate">{course.name}</p>
					{hasUnmetPrereq && (
						<p className="text-xs text-danger-500 mt-1">
							Requires: {course.prerequisiteCode}
						</p>
					)}
				</div>
				<span className="text-text-subtle ml-2 text-lg shrink-0">
					{expanded ? "▾" : "▸"}
				</span>
			</button>

			{expanded && (
				<div className="border-t border-border-muted bg-surface-muted p-3 space-y-2">
					{hasUnmetPrereq && (
						<p className="text-xs text-danger-500 bg-danger-50 border border-danger-200 rounded px-3 py-2">
							Prerequisite not met: complete{" "}
							<span className="font-semibold">{course.prerequisiteCode}</span>{" "}
							first
						</p>
					)}
					{loading && sections.length === 0 ? (
						<p className="text-sm text-text-subtle text-center py-2">
							Loading sections...
						</p>
					) : sections.length === 0 ? (
						<p className="text-sm text-text-subtle text-center py-2">
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
