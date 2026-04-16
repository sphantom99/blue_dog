import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStudentStore } from "../store/useStudentStore";

export default function Navbar() {
	const { profile, logout } = useStudentStore();
	const navigate = useNavigate();
	const location = useLocation();
	const [menuOpen, setMenuOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const linkClass = (path: string) =>
		`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
			location.pathname === path
				? "bg-indigo-800 text-white"
				: "text-indigo-100 hover:bg-indigo-500 hover:text-white"
		}`;

	const drawerLinkClass = (path: string) =>
		`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
			location.pathname === path
				? "bg-indigo-800 text-white"
				: "text-indigo-100 hover:bg-indigo-500 hover:text-white"
		}`;

	return (
		<>
			<nav className="bg-indigo-600 shadow-lg shrink-0 relative z-30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<div className="flex items-center gap-4">
							<span className="text-white font-bold text-lg">Maplewood</span>
							{/* Desktop nav links */}
							{profile && (
								<div className="hidden md:flex gap-1">
									<Link to="/dashboard" className={linkClass("/dashboard")}>
										Dashboard
									</Link>
									<Link to="/enroll" className={linkClass("/enroll")}>
										Plan Semester
									</Link>
								</div>
							)}
						</div>

						{/* Desktop: user info + logout */}
						{profile && (
							<div className="hidden md:flex items-center gap-4">
								<span className="text-indigo-100 text-sm">
									{profile.firstName} {profile.lastName} · Grade{" "}
									{profile.gradeLevel}
								</span>
								<button
									type="button"
									onClick={handleLogout}
									className="text-indigo-100 hover:text-white text-sm px-3 py-1.5 rounded-md hover:bg-indigo-500 transition-colors cursor-pointer"
								>
									Logout
								</button>
							</div>
						)}

						{/* Mobile: hamburger button */}
						{profile && (
							<button
								type="button"
								onClick={() => setMenuOpen(true)}
								className="md:hidden text-indigo-100 hover:text-white p-2 rounded-md hover:bg-indigo-500 transition-colors cursor-pointer"
								aria-label="Open menu"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							</button>
						)}
					</div>
				</div>
			</nav>

			{/* ── Right-side drawer (mobile only) ── */}
			{profile && (
				<>
					{/* Backdrop — fades in/out */}
					<div
						onClick={() => setMenuOpen(false)}
						className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
							menuOpen
								? "opacity-100 pointer-events-auto"
								: "opacity-0 pointer-events-none"
						}`}
						aria-hidden="true"
					/>

					{/* Drawer panel — slides in from the right */}
					<section
						className={`md:hidden fixed top-0 right-0 h-full w-72 z-50 bg-indigo-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
							menuOpen ? "translate-x-0" : "translate-x-full"
						}`}
						aria-label="Navigation drawer"
					>
						{/* Drawer header */}
						<div className="flex items-center justify-between px-5 py-4 border-b border-indigo-500">
							<span className="text-white font-bold text-base">Maplewood</span>
							<button
								type="button"
								onClick={() => setMenuOpen(false)}
								className="text-indigo-200 hover:text-white p-1.5 rounded-md hover:bg-indigo-500 transition-colors cursor-pointer"
								aria-label="Close menu"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						{/* User info */}
						<div className="px-5 py-4 border-b border-indigo-500">
							<p className="text-white text-sm font-semibold">
								{profile.firstName} {profile.lastName}
							</p>
							<p className="text-indigo-300 text-xs mt-0.5">
								Grade {profile.gradeLevel}
							</p>
						</div>

						{/* Nav links */}
						<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
							<Link
								to="/dashboard"
								className={drawerLinkClass("/dashboard")}
								onClick={() => setMenuOpen(false)}
							>
								{/* Grid icon */}
								<svg
									className="w-4 h-4 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 7h18M3 12h18M3 17h18"
									/>
								</svg>
								Dashboard
							</Link>
							<Link
								to="/enroll"
								className={drawerLinkClass("/enroll")}
								onClick={() => setMenuOpen(false)}
							>
								{/* Calendar icon */}
								<svg
									className="w-4 h-4 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								Plan Semester
							</Link>
						</nav>

						{/* Logout at bottom */}
						<div className="px-3 py-4 border-t border-indigo-500">
							<button
								type="button"
								onClick={() => {
									setMenuOpen(false);
									handleLogout();
								}}
								className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-indigo-100 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
							>
								<svg
									className="w-4 h-4 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
									/>
								</svg>
								Logout
							</button>
						</div>
					</section>
				</>
			)}
		</>
	);
}
