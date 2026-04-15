import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import { useStudentStore } from "../store/useStudentStore";

export default function DashboardPage() {
	const { profile, studentId } = useStudentStore();
	const navigate = useNavigate();

	useEffect(() => {
		if (!studentId) navigate("/login");
	}, [studentId, navigate]);

	if (!profile) return null;

	const graduationPct = profile.totalCreditsRequired > 0
		? Math.round((profile.creditsPassed / profile.totalCreditsRequired) * 100)
		: 0;

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
				{/* Student Info Card */}
				<div className="bg-white rounded-xl shadow p-6 flex flex-wrap items-center justify-between gap-6">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">
							{profile.firstName} {profile.lastName}
						</h2>
						<p className="text-gray-500 mt-1">
							Grade {profile.gradeLevel} · {profile.email}
						</p>
					</div>
					<div className="flex gap-6 text-center">
						<div className="bg-indigo-50 rounded-lg px-5 py-3">
							<p className="text-2xl font-bold text-indigo-600">
								{profile.gpa.toFixed(2)}
							</p>
							<p className="text-xs text-gray-500 uppercase tracking-wide">
								GPA
							</p>
						</div>
						<div className="bg-green-50 rounded-lg px-5 py-3">
							<p className="text-2xl font-bold text-green-600">
								{profile.creditsPassed}
							</p>
							<p className="text-xs text-gray-500 uppercase tracking-wide">
								Credits Earned
							</p>
						</div>
						<div className="bg-amber-50 rounded-lg px-5 py-3">
							<p className="text-2xl font-bold text-amber-600">
								{graduationPct}%
							</p>
							<p className="text-xs text-gray-500 uppercase tracking-wide">
								Graduation
							</p>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="bg-white rounded-xl shadow p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-3">
						Graduation Progress
					</h3>
					<ProgressBar
						value={profile.creditsPassed}
						max={profile.totalCreditsRequired}
						label={`${profile.creditsPassed} / ${profile.totalCreditsRequired} credits`}
					/>
				</div>

				{/* Course History */}
				<div className="bg-white rounded-xl shadow overflow-hidden">
					<div className="p-6 border-b border-gray-200 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900">
							Course History
						</h3>
						<button
							type="button"
							onClick={() => navigate("/enroll")}
							className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
						>
							Plan Semester
						</button>
					</div>
					{profile.courseHistory.length === 0 ? (
						<div className="p-6 text-center text-gray-500">
							No course history yet. Start planning your first
							semester!
						</div>
					) : (
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Course
									</th>
									<th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Semester
									</th>
									<th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Credits
									</th>
									<th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{profile.courseHistory.map((ch) => (
									<tr key={`${ch.courseId}-${ch.semesterYear}`} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<p className="font-medium text-gray-900">
												{ch.courseCode}
											</p>
											<p className="text-sm text-gray-500">
												{ch.courseName}
											</p>
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											{ch.semesterName}{" "}
											{ch.semesterYear}
										</td>
										<td className="px-6 py-4 text-center text-sm text-gray-600">
											{ch.credits}
										</td>
										<td className="px-6 py-4 text-center">
											<span
												className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
													ch.status === "passed"
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
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
				</div>
			</main>
		</div>
	);
}
