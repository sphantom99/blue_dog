import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStudentStore } from "../store/useStudentStore";

export default function Navbar() {
	const { profile, logout } = useStudentStore();
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const linkClass = (path: string) =>
		`px-3 py-2 rounded-md text-sm font-medium ${
			location.pathname === path
				? "bg-indigo-700 text-white"
				: "text-indigo-100 hover:bg-indigo-500 hover:text-white"
		}`;

	return (
		<nav className="bg-indigo-600 shadow-lg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center gap-4">
						<span className="text-white font-bold text-lg">Maplewood</span>
						{profile && (
							<div className="flex gap-1">
								<Link to="/dashboard" className={linkClass("/dashboard")}>
									Dashboard
								</Link>
								<Link to="/enroll" className={linkClass("/enroll")}>
									Plan Semester
								</Link>
							</div>
						)}
					</div>
					{profile && (
						<div className="flex items-center gap-4">
							<span className="text-indigo-100 text-sm">
								{profile.firstName} {profile.lastName} · Grade{" "}
								{profile.gradeLevel}
							</span>
							<button
								type="button"
								onClick={handleLogout}
								className="text-indigo-100 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-indigo-500 transition-colors"
							>
								Logout
							</button>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}
