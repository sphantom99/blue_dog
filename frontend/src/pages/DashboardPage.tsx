import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import { CardSkeleton, TableSkeleton } from "../components/Skeleton";
import { Card } from "../components/ui";
import { DAY_NAMES } from "../lib/dayNames";
import { SUBJECT_COLORS } from "../lib/specializationColors";
import { useCourseStore } from "../store/useCourseStore";
import { useStudentStore } from "../store/useStudentStore";

export default function DashboardPage() {
	const { profile, studentId, loading } = useStudentStore();
	const navigate = useNavigate();

	useEffect(() => {
		if (!studentId) navigate("/login");
	}, [studentId, navigate]);

	const { schedule, fetchSchedule } = useCourseStore();

	useEffect(() => {
		if (studentId) {
			fetchSchedule(studentId);
		}
	}, [studentId, fetchSchedule]);

	if (!studentId) return null;

	if (loading || !profile) {
		return (
			<div className="min-h-screen bg-surface-muted">
				<Navbar />
				<main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
					<CardSkeleton />
					<CardSkeleton />
					<TableSkeleton rows={4} />
				</main>
			</div>
		);
	}

	const graduationPct =
		profile.totalCreditsRequired > 0
			? Math.round((profile.creditsPassed / profile.totalCreditsRequired) * 100)
			: 0;

	return (
		<div className="min-h-screen bg-surface-muted">
			<Navbar />
			<main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
				{/* Student Info Card */}
				<Card className="flex flex-wrap items-center justify-between gap-6">
					<div>
						<h2 className="text-2xl font-bold text-text-base">
							{profile.firstName} {profile.lastName}
						</h2>
						<p className="text-text-muted mt-1">
							Grade {profile.gradeLevel} · {profile.email}
						</p>
					</div>
					<div className="flex gap-6 text-center">
						<div className="bg-primary-50 rounded-lg px-5 py-3">
							<p className="text-2xl font-bold text-primary-600">
								{profile.gpa.toFixed(2)}
							</p>
							<p className="text-xs text-text-muted uppercase tracking-wide">GPA</p>
						</div>
						<div className="bg-success-50 rounded-lg px-5 py-3">
							<p className="text-2xl font-bold text-success-600">
								{profile.creditsPassed}
							</p>
							<p className="text-xs text-text-muted uppercase tracking-wide">
								Credits Earned
							</p>
						</div>
						<div className="bg-warning-50 rounded-lg px-5 py-3">
							<p className="text-2xl font-bold text-warning-600">{graduationPct}%</p>
							<p className="text-xs text-text-muted uppercase tracking-wide">
								Graduation
							</p>
						</div>
					</div>
				</Card>

				{/* Graduation Progress */}
				<Card>
					<h3 className="text-lg font-semibold text-text-base mb-3">
						Graduation Progress
					</h3>
					<ProgressBar
						value={profile.creditsPassed}
						max={profile.totalCreditsRequired}
						label={`${profile.creditsPassed} / ${profile.totalCreditsRequired} credits`}
					/>
				</Card>

				{/* Current Subjects */}
				<Card>
					<h3 className="text-lg font-semibold text-text-base mb-3">
						Current Subjects
					</h3>
					{schedule?.enrolledSections.length === 0 ? (
						<p className="text-text-muted">
							Not enrolled in any courses this semester.
						</p>
					) : (
						<ul className="list-disc list-inside space-y-1">
							{schedule?.enrolledSections.map((section) => (
								<li
									key={section.id}
									className={`rounded-lg px-2 py-1 ${SUBJECT_COLORS[section.specialization]?.bg || "bg-gray-100"} ${SUBJECT_COLORS[section.specialization]?.text || "text-text-base"}`}
								>
									{section.courseCode} - {section.courseName}
									<span className="text-sm text-text-muted">
										{" — "}
										{section.meetings
											.map((m) => {
												const day = DAY_NAMES[m.timeslot.dayOfWeek] || "?";
												const start = m.timeslot.startTime.slice(0, 5);
												return `${day} ${start}`;
											})
											.join(", ")}
									</span>
								</li>
							))}
						</ul>
					)}
				</Card>

				{/* Course History */}
				<Card noPadding>
					<div className="p-6 border-b border-border flex items-center justify-between">
						<h3 className="text-lg font-semibold text-text-base">
							Course History
						</h3>
						<button
							type="button"
							onClick={() => navigate("/enroll")}
							className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
						>
							Plan Semester
						</button>
					</div>
					{profile.courseHistory.length === 0 ? (
						<div className="p-6 text-center text-text-muted">
							No course history yet. Start planning your first semester!
						</div>
					) : (
						<table className="w-full">
							<thead className="bg-surface-muted">
								<tr>
									<th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
										Course
									</th>
									<th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
										Semester
									</th>
									<th className="text-center px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
										Credits
									</th>
									<th className="text-center px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{profile.courseHistory
									.sort((a, b) => {
										const semA = `${a.semesterYear}-${a.semesterName}`;
										const semB = `${b.semesterYear}-${b.semesterName}`;
										if (semA !== semB) return semB.localeCompare(semA);
										return a.courseCode.localeCompare(b.courseCode);
									})
									.map((ch) => (
										<tr
											key={`${ch.courseId}-${ch.semesterYear}`}
											className="hover:bg-surface-muted"
										>
											<td className="px-6 py-4">
												<p className="font-medium text-text-base">
													{ch.courseCode}
												</p>
												<p className="text-sm text-text-muted">{ch.courseName}</p>
											</td>
											<td className="px-6 py-4 text-sm text-gray-600">
												{ch.semesterName} {ch.semesterYear}
											</td>
											<td className="px-6 py-4 text-center text-sm text-gray-600">
												{ch.credits}
											</td>
											<td className="px-6 py-4 text-center">
												<span
													className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
														ch.status === "passed"
															? "bg-success-100 text-success-800"
															: "bg-danger-100 text-danger-800"
													}`}
												>
													{ch.status}
												</span>
											</td>
										</tr>
									))}
							</tbody>
						</table>
					)}
				</Card>
			</main>
		</div>
	);
}
