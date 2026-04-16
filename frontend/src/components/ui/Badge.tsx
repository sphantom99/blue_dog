interface BadgeProps {
	children: React.ReactNode;
	variant?: "primary" | "success" | "warning" | "danger" | "pending" | "neutral";
	className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
	primary: "bg-primary-100 text-primary-700",
	success: "bg-success-100 text-success-700",
	warning: "bg-warning-100 text-warning-700",
	danger:  "bg-danger-100 text-danger-700",
	pending: "bg-pending-100 text-pending-700",
	neutral: "bg-gray-100 text-gray-600",
};

export default function Badge({
	children,
	variant = "neutral",
	className = "",
}: BadgeProps) {
	return (
		<span
			className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${VARIANT_CLASSES[variant]} ${className}`}
		>
			{children}
		</span>
	);
}
