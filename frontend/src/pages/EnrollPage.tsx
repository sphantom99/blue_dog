import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarGrid from "../components/CalendarGrid";
import CourseCard from "../components/CourseCard";
import Navbar from "../components/Navbar";
import { useCourseStore } from "../store/useCourseStore";
import { useStudentStore } from "../store/useStudentStore";

export default function EnrollPage() {
	const { profile, studentId } = useStudentStore();
	const {
		courses,
		coursesLoading,
		schedule,
		scheduleLoading,
		enrollmentErrors,
		clearEnrollmentErrors,
		fetchActiveSemester,
		fetchCourses,
		fetchSchedule,
		activeSemester,
	} = useCourseStore();
	const navigate = useNavigate();

	// Filter state
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [search, setSearch] = useState("");

	// Resizable split pane
	const [splitPct, setSplitPct] = useState(40);
	const dragging = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!studentId) {
			navigate("/login");
			return;
		}
		fetchActiveSemester();
		fetchSchedule(studentId);
	}, [studentId, navigate, fetchActiveSemester, fetchSchedule]);

	useEffect(() => {
		if (!activeSemester || !profile) return;
		fetchCourses({
			gradeLevel: profile.gradeLevel,
			semester: activeSemester.orderInYear,
		});
	}, [activeSemester, profile, fetchCourses]);

	// Passed course IDs for prerequisite checking
	const passedCourseIds = useMemo(() => {
		if (!profile) return new Set<number>();
		return new Set(
			profile.courseHistory
				.filter((ch) => ch.status === "passed")
				.map((ch) => ch.courseId),
		);
	}, [profile]);

	// Filtered courses
	const filteredCourses = useMemo(() => {
		return courses.filter((c) => {
			if (typeFilter !== "all" && c.courseType !== typeFilter) return false;
			if (search) {
				const s = search.toLowerCase();
				return (
					c.code.toLowerCase().includes(s) ||
					c.name.toLowerCase().includes(s)
				);
			}
			return true;
		});
	}, [courses, typeFilter, search]);

	// Drag handlers for resizable pane
	const handleMouseDown = useCallback(() => {
		dragging.current = true;
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}, []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!dragging.current || !containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const pct = ((e.clientX - rect.left) / rect.width) * 100;
			setSplitPct(Math.min(70, Math.max(25, pct)));
		};
		const handleMouseUp = () => {
			dragging.current = false;
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	// Auto-dismiss enrollment errors after 5 seconds
	useEffect(() => {
		if (enrollmentErrors.length === 0) return;
		const timer = setTimeout(clearEnrollmentErrors, 5000);
		return () => clearTimeout(timer);
	}, [enrollmentErrors, clearEnrollmentErrors]);

	if (!profile || !studentId) return null;

	const enrolledCount = schedule?.enrolledSections.length ?? 0;

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />

			{/* Toast errors */}
			{enrollmentErrors.length > 0 && (
				<div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
					{enrollmentErrors.map((err) => (
						<div
							key={err.code}
							className="bg-red-50 border border-red-300 text-red-800 text-sm px-4 py-3 rounded-lg shadow-lg"
						>
							<p className="font-medium">{err.code.replace(/_/g, " ")}</p>
							<p className="text-xs mt-0.5">{err.message}</p>
						</div>
					))}
				</div>
			)}

			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
				<div>
					<h1 className="text-lg font-bold text-gray-900">
						Plan Semester
					</h1>
					{activeSemester && (
						<p className="text-sm text-gray-500">
							{activeSemester.name} {activeSemester.year}
						</p>
					)}
				</div>
				<div className="text-sm font-medium">
					<span
						className={
							enrolledCount >= 5
								? "text-red-600"
								: "text-indigo-600"
						}
					>
						{enrolledCount}/5
					</span>{" "}
					<span className="text-gray-500">courses enrolled</span>
				</div>
			</div>

			{/* Split pane: left = course browser, right = calendar */}
			<div
				ref={containerRef}
				className="flex-1 flex overflow-hidden"
			>
				{/* Left: Course Browser */}
				<div
					className="overflow-y-auto border-r border-gray-200 bg-white"
					style={{ width: `${splitPct}%` }}
				>
					{/* Filters */}
					<div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 space-y-3">
						<input
							type="text"
							placeholder="Search courses..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
						/>
						<div className="flex gap-2">
							{["all", "core", "elective"].map((t) => (
								<button
									type="button"
									key={t}
									onClick={() => setTypeFilter(t)}
									className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
										typeFilter === t
											? "bg-indigo-600 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{t === "all"
										? "All"
										: t.charAt(0).toUpperCase() + t.slice(1)}
								</button>
							))}
						</div>
					</div>

					{/* Course list */}
					<div className="p-4 space-y-2">
						{coursesLoading ? (
							<p className="text-sm text-gray-400 text-center py-8">
								Loading courses...
							</p>
						) : filteredCourses.length === 0 ? (
							<p className="text-sm text-gray-400 text-center py-8">
								No courses found
							</p>
						) : (
							filteredCourses.map((course) => (
								<CourseCard
									key={course.id}
									course={course}
									studentId={studentId}
									passedCourseIds={passedCourseIds}
								/>
							))
						)}
					</div>
				</div>

				{/* Resizable divider */}
				<div
					role="separator"
					aria-valuenow={splitPct}
					aria-valuemin={25}
					aria-valuemax={70}
					aria-label="Resize panes"
					tabIndex={0}
					onMouseDown={handleMouseDown}
					onKeyDown={(e) => {
						if (e.key === "ArrowLeft") setSplitPct((p) => Math.max(25, p - 2));
						if (e.key === "ArrowRight") setSplitPct((p) => Math.min(70, p + 2));
					}}
					className="w-1.5 bg-gray-200 hover:bg-indigo-400 cursor-col-resize shrink-0 transition-colors"
				/>

				{/* Right: Calendar */}
				<div
					className="overflow-y-auto p-4"
					style={{ width: `${100 - splitPct}%` }}
				>
					{scheduleLoading ? (
						<p className="text-sm text-gray-400 text-center py-8">
							Loading schedule...
						</p>
					) : (
						<CalendarGrid
							enrolledSections={
								schedule?.enrolledSections ?? []
							}
							studentId={studentId}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
