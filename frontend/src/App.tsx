import { Navigate, Route, Routes } from "react-router-dom";
import ToastContainer from "./components/Toast";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import EnrollPage from "./pages/EnrollPage";
import LoginPage from "./pages/LoginPage";

function App() {
	return (
		<>
			<ToastContainer />
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/dashboard" element={<DashboardPage />} />
				<Route path="/enroll" element={<EnrollPage />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		</>
	);
}

export default App;
