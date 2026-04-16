import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { CardSkeleton, TableSkeleton } from "../../components/Skeleton";
import { useCourseStore } from "../../store/useCourseStore";
import { useStudentStore } from "../../store/useStudentStore";
import CurrentSubjects from "./CurrentSubjects";
import GraduationProgress from "./GraduationProgress";
import History from "./History";
import StudentInfoCard from "./StudentInfoCard";

export default function DashboardPage() {
	const { profile, studentId, loading } = useStudentStore();
	const navigate = useNavigate();

	useEffect(() => {
		if (!studentId) {
			navigate("/login");
		}
	}, [studentId, navigate]);

	const { fetchSchedule } = useCourseStore();

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

	return (
		<div className="min-h-screen bg-surface-muted">
			<Navbar />
			<main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

				<StudentInfoCard />

				<GraduationProgress />

				<CurrentSubjects />

				<History />

			</main>
		</div>
	);
}
