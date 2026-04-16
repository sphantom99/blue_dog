import { useEffect, useState } from "react";
import { subscribe, type ToastMessage } from "../lib/toastService";

export default function ToastContainer() {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	useEffect(() => {
		return subscribe((msg) => {
			setToasts((prev) => [...prev, msg]);
		});
	}, []);

	// Auto-remove each toast after 4 seconds
	useEffect(() => {
		if (toasts.length === 0) return;
		const timer = setTimeout(() => {
			setToasts((prev) => prev.slice(1));
		}, 4000);
		return () => clearTimeout(timer);
	}, [toasts]);

	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`px-4 py-3 rounded-lg shadow-lg border text-sm animate-slide-in-from-right ${
						toast.type === "success"
							? "bg-green-50 border-green-300 text-green-800"
							: "bg-red-50 border-red-300 text-red-800"
					}`}
				>
					<p className="font-medium">{toast.title}</p>
					{toast.detail && (
						<p className="text-xs mt-0.5 opacity-80">{toast.detail}</p>
					)}
				</div>
			))}
		</div>
	);
}
