interface ProgressBarProps {
	value: number;
	max: number;
	label?: string;
}

export default function ProgressBar({ value, max, label }: ProgressBarProps) {
	const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

	return (
		<div>
			<div className="flex justify-between text-sm text-gray-600 mb-1">
				{label && <span>{label}</span>}
				<span>{pct}%</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-3">
				<div
					className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
