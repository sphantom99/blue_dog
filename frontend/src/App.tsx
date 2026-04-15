import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import EnrollPage from "./pages/EnrollPage";
import LoginPage from "./pages/LoginPage";

function App() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/dashboard" element={<DashboardPage />} />
			<Route path="/enroll" element={<EnrollPage />} />
			<Route path="*" element={<Navigate to="/login" replace />} />
		</Routes>
	);
}

export default App;
