import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentStore } from "../store/useStudentStore";

export default function LoginPage() {
	const [studentId, setStudentId] = useState("");
	const { fetchProfile, loading, error } = useStudentStore();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const id = parseInt(studentId, 10);
		if (Number.isNaN(id) || id <= 0) return;
		await fetchProfile(id);
		// Check if profile loaded successfully
		const { profile } = useStudentStore.getState();
		if (profile) {
			navigate("/dashboard");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Maplewood</h1>
					<p className="mt-2 text-gray-500">Course Planning System</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="studentId"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Student ID
						</label>
						<input
							id="studentId"
							type="number"
							min="1"
							value={studentId}
							onChange={(e) => setStudentId(e.target.value)}
							placeholder="Enter your student ID"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
							required
						/>
					</div>

					{error && (
						<p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading || !studentId}
						className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
					>
						{loading && (
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
						)}
						{loading ? "Signing in..." : "Sign In"}
					</button>
				</form>
			</div>
		</div>
	);
}
