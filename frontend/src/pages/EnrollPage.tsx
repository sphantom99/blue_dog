import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarGrid from "../components/CalendarGrid";
import CourseCard from "../components/CourseCard";
import Navbar from "../components/Navbar";
import { CalendarSkeleton, CourseListSkeleton } from "../components/Skeleton";
import { useCourseStore } from "../store/useCourseStore";
import { useStudentStore } from "../store/useStudentStore";

export default function EnrollPage() {
	const { profile, studentId } = useStudentStore();
	const {
		courses,
		coursesLoading,
		schedule,
		scheduleLoading,
		fetchActiveSemester,
		fetchCourses,
		fetchSchedule,
		activeSemester,
		pendingEnrollments,
		pendingLoading,
		cancelPending,
		commitPending,
	} = useCourseStore();
	const navigate = useNavigate();

	// Filter state
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [search, setSearch] = useState("");

	// Mobile tab state
	const [mobileTab, setMobileTab] = useState<"courses" | "schedule">("courses");

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
					c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)
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

	if (!profile || !studentId) return null;

	const enrolledCount = schedule?.enrolledSections.length ?? 0;
	const pendingCount = pendingEnrollments.length;
	const totalCount = enrolledCount + pendingCount;

	const handleSave = () => commitPending(studentId);
	const handleCancel = () => cancelPending();

	return (
		<div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
			<Navbar />

			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
				<div>
					<h1 className="text-lg font-bold text-gray-900">Plan Semester</h1>
					{activeSemester && (
						<p className="text-sm text-gray-500">
							{activeSemester.name} {activeSemester.year}
						</p>
					)}
				</div>
				<div className="text-sm font-medium flex items-center gap-2">
					<span
						className={totalCount >= 5 ? "text-red-600" : "text-indigo-600"}
					>
						{enrolledCount}
						{pendingCount > 0 && (
							<span className="text-blue-500">+{pendingCount}</span>
						)}
						/5
					</span>{" "}
					<span className="text-gray-500">courses</span>
				</div>
			</div>

			{/* ── Mobile tab bar (hidden on md+) ── */}
			<div className="md:hidden flex shrink-0 bg-white border-b border-gray-200">
				<button
					type="button"
					onClick={() => setMobileTab("courses")}
					className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
						mobileTab === "courses"
							? "border-b-2 border-indigo-600 text-indigo-600"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Courses
				</button>
				<button
					type="button"
					onClick={() => setMobileTab("schedule")}
					className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
						mobileTab === "schedule"
							? "border-b-2 border-indigo-600 text-indigo-600"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					Schedule
				</button>
			</div>

			{/* ── Mobile: single-pane view ── */}
			<div className="md:hidden flex-1 overflow-hidden min-h-0 flex flex-col">
				{/* Mobile: Course browser — always mounted, hidden via CSS when not active */}
				<div className={`flex flex-col flex-1 overflow-hidden bg-white ${mobileTab === "courses" ? "" : "hidden"}`}>
					<div className="shrink-0 bg-white z-10 p-4 border-b border-gray-100 space-y-3">
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
									className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
										typeFilter === t
											? "bg-indigo-600 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
								</button>
							))}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-4 space-y-2">
						{coursesLoading ? (
							<CourseListSkeleton count={6} />
						) : filteredCourses.length === 0 ? (
							<p className="text-sm text-gray-400 text-center py-8">No courses found</p>
						) : (
							filteredCourses.map((course) => (
								<CourseCard
									key={course.id}
									course={course}
									passedCourseIds={passedCourseIds}
								/>
							))
						)}
					</div>
				</div>

				{/* Mobile: Calendar — always mounted, hidden via CSS when not active */}
				<div className={`flex-1 overflow-y-auto p-4 ${mobileTab === "schedule" ? "" : "hidden"}`}>
					{scheduleLoading ? (
						<CalendarSkeleton />
					) : (
						<CalendarGrid
							enrolledSections={schedule?.enrolledSections ?? []}
							pendingSections={pendingEnrollments}
							studentId={studentId}
						/>
					)}
				</div>
			</div>

			{/* ── Desktop: resizable split pane (hidden below md) ── */}
			<div ref={containerRef} className="hidden md:flex flex-1 overflow-hidden min-h-0">
				{/* Left: Course Browser */}
				<div
					className="flex flex-col border-r border-gray-200 bg-white overflow-hidden"
					style={{ width: `${splitPct}%` }}
				>
					{/* Filters — sticky */}
					<div className="shrink-0 bg-white z-10 p-4 border-b border-gray-100 space-y-3">
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
									className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
										typeFilter === t
											? "bg-indigo-600 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
								</button>
							))}
						</div>
					</div>

					{/* Scrollable course list */}
					<div className="flex-1 overflow-y-auto p-4 space-y-2">
						{coursesLoading ? (
							<CourseListSkeleton count={6} />
						) : filteredCourses.length === 0 ? (
							<p className="text-sm text-gray-400 text-center py-8">
								No courses found
							</p>
						) : (
							filteredCourses.map((course) => (
								<CourseCard
									key={course.id}
									course={course}
									passedCourseIds={passedCourseIds}
								/>
							))
						)}
					</div>
				</div>

				{/* Resizable divider */}
				{/** biome-ignore lint/a11y/useSemanticElements: we need this because its draggable */}
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
						<CalendarSkeleton />
					) : (
						<CalendarGrid
							enrolledSections={schedule?.enrolledSections ?? []}
							pendingSections={pendingEnrollments}
							studentId={studentId}
						/>
					)}
				</div>
			</div>

			{/* FAB — appears when there are pending enrollments */}
			{pendingCount > 0 && (
				<div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
					<button
						type="button"
						onClick={handleCancel}
						disabled={pendingLoading}
						className="px-4 py-2.5 rounded-full text-sm font-semibold bg-white text-gray-700 border border-gray-300 shadow-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={pendingLoading}
						className="px-5 py-2.5 rounded-full text-sm font-semibold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
					>
						{pendingLoading ? (
							<span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
						) : null}
						Save {pendingCount} course{pendingCount !== 1 ? "s" : ""}
					</button>
				</div>
			)}
		</div>
	);
}
