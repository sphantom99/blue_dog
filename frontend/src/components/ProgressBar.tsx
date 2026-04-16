import { useCountUp } from "../lib/useCountUp";
interface ProgressBarProps {
	label?: string;
	gradPct?: number;
}

export default function ProgressBar({ label, gradPct }: ProgressBarProps) {

	const gradPctRef = useCountUp<HTMLParagraphElement>(gradPct ?? 0, { duration: 1.5, suffix: '%' });

	return (
		<div>
			<div className="flex justify-between text-sm text-gray-600 mb-1">
				{label && <span>{label}</span>}
				<p className="text-sm font-bold text-gray-600" ref={gradPctRef} />
			</div>
			<div className="w-full bg-gray-200 rounded-full h-3">
				<div
					style={{ width: `${gradPct ?? 0}%` }}
				>
					<div
						className="bg-indigo-600 h-3 rounded-full animate-extend-to-full-width"
					/>
				</div>
			</div>
		</div>
	);
}
