import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarGrid from "../components/CalendarGrid";
import CourseCard from "../components/CourseCard";
import Navbar from "../components/Navbar";
import { CalendarSkeleton, CourseListSkeleton } from "../components/Skeleton";
import { Button } from "../components/ui";
import { useCourseStore } from "../store/useCourseStore";
import { useStudentStore } from "../store/useStudentStore";

interface CourseFiltersProps {
	search: string;
	onSearch: (v: string) => void;
	typeFilter: string;
	onTypeFilter: (v: string) => void;
}

function CourseFilters({
	search,
	onSearch,
	typeFilter,
	onTypeFilter,
}: CourseFiltersProps) {
	return (
		<div className="shrink-0 bg-surface z-10 p-4 border-b border-border-muted space-y-3">
			<input
				type="text"
				placeholder="Search courses..."
				value={search}
				onChange={(e) => onSearch(e.target.value)}
				className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
			/>
			<div className="flex gap-2">
				{(["all", "core", "elective"] as const).map((t) => (
					<button
						type="button"
						key={t}
						onClick={() => onTypeFilter(t)}
						className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
							typeFilter === t
								? "bg-primary-600 text-white"
								: "bg-surface-subtle text-gray-600 hover:bg-gray-200"
						}`}
					>
						{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
					</button>
				))}
			</div>
		</div>
	);
}

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

	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [search, setSearch] = useState("");
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

	const passedCourseIds = useMemo(() => {
		if (!profile) return new Set<number>();
		return new Set(
			profile.courseHistory
				.filter((ch) => ch.status === "passed")
				.map((ch) => ch.courseId),
		);
	}, [profile]);

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

	const courseList = (
		<div className="flex-1 overflow-y-auto p-4 space-y-2">
			{coursesLoading ? (
				<CourseListSkeleton count={6} />
			) : filteredCourses.length === 0 ? (
				<p className="text-sm text-text-subtle text-center py-8">
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
	);

	const calendar = scheduleLoading ? (
		<CalendarSkeleton />
	) : (
		<CalendarGrid
			enrolledSections={schedule?.enrolledSections ?? []}
			pendingSections={pendingEnrollments}
			studentId={studentId}
		/>
	);

	return (
		<div className="h-screen bg-surface-muted flex flex-col overflow-hidden">
			<Navbar />

			{/* Header */}
			<div className="bg-surface border-b border-border px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
				<div>
					<h1 className="text-lg font-bold text-text-base">Plan Semester</h1>
					{activeSemester && (
						<p className="text-sm text-text-muted">
							{activeSemester.name} {activeSemester.year}
						</p>
					)}
				</div>
				<div className="text-sm font-medium flex items-center gap-2">
					<span className={totalCount >= 5 ? "text-danger-600" : "text-primary-600"}>
						{enrolledCount}
						{pendingCount > 0 && (
							<span className="text-pending-500">+{pendingCount}</span>
						)}
						/5
					</span>{" "}
					<span className="text-text-muted">courses</span>
				</div>
			</div>

			{/* ── Mobile tab bar (hidden on md+) ── */}
			<div className="md:hidden flex shrink-0 bg-surface border-b border-border">
				{(["courses", "schedule"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setMobileTab(tab)}
						className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer capitalize ${
							mobileTab === tab
								? "border-b-2 border-primary-600 text-primary-600"
								: "text-text-muted hover:text-gray-700"
						}`}
					>
						{tab}
					</button>
				))}
			</div>

			{/* ── Mobile: single-pane view ── */}
			<div className="md:hidden flex-1 overflow-hidden min-h-0 flex flex-col">
				<div
					className={`flex flex-col flex-1 overflow-hidden bg-surface ${mobileTab === "courses" ? "" : "hidden"}`}
				>
					<CourseFilters
						search={search}
						onSearch={setSearch}
						typeFilter={typeFilter}
						onTypeFilter={setTypeFilter}
					/>
					{courseList}
				</div>

				<div
					className={`flex-1 overflow-y-auto p-4 ${mobileTab === "schedule" ? "" : "hidden"}`}
				>
					{calendar}
				</div>
			</div>

			{/* ── Desktop: resizable split pane (hidden below md) ── */}
			<div
				ref={containerRef}
				className="hidden md:flex flex-1 overflow-hidden min-h-0"
			>
				{/* Left: Course Browser */}
				<div
					className="flex flex-col border-r border-border bg-surface overflow-hidden"
					style={{ width: `${splitPct}%` }}
				>
					<CourseFilters
						search={search}
						onSearch={setSearch}
						typeFilter={typeFilter}
						onTypeFilter={setTypeFilter}
					/>
					{courseList}
				</div>

				{/* Resizable divider */}
				{/** biome-ignore lint/a11y/useSemanticElements: draggable divider */}
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
					className="w-1.5 bg-border hover:bg-primary-400 cursor-col-resize shrink-0 transition-colors"
				/>

				{/* Right: Calendar */}
				<div
					className="overflow-y-auto p-4"
					style={{ width: `${100 - splitPct}%` }}
				>
					{calendar}
				</div>
			</div>

			{pendingCount > 0 && (
				<div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
					<Button
						variant="secondary"
						onClick={cancelPending}
						disabled={pendingLoading}
						className="rounded-full shadow-lg font-semibold"
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={() => commitPending(studentId)}
						loading={pendingLoading}
						className="rounded-full shadow-lg font-semibold"
					>
						Save {pendingCount} course{pendingCount !== 1 ? "s" : ""}
					</Button>
				</div>
			)}
		</div>
	);
}
