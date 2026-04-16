interface CardProps {
	children: React.ReactNode;
	className?: string;
	/** Removes default padding — useful when embedding a table or full-bleed content */
	noPadding?: boolean;
}

export default function Card({ children, className = "", noPadding = false }: CardProps) {
	return (
		<div
			className={`bg-surface rounded-xl shadow ${noPadding ? "" : "p-6"} ${className}`}
		>
			{children}
		</div>
	);
}
