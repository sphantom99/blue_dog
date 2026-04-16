import { Navigate, Route, Routes } from "react-router-dom";
import ToastContainer from "./components/Toast";
import { lazy } from "react";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const EnrollPage = lazy(() => import("./pages/EnrollPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));



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
