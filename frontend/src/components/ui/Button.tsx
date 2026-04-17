import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
	loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
	primary:   "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50",
	secondary: "bg-surface text-text-muted border border-border hover:bg-surface-muted disabled:opacity-50",
	ghost:     "bg-surface-subtle text-text-muted hover:bg-surface-subtle disabled:opacity-50",
	danger:    "bg-danger-100 text-danger-700 hover:bg-danger-200 disabled:opacity-50",
};

const SIZE_CLASSES: Record<Size, string> = {
	sm: "px-3 py-1.5 text-xs",
	md: "px-4 py-2.5 text-sm",
};

export default function Button({
	variant = "primary",
	size = "md",
	loading = false,
	disabled,
	className = "",
	children,
	...rest
}: ButtonProps) {
	return (
		<button
			type="button"
			disabled={disabled || loading}
			className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
			{...rest}
		>
			{loading && (
				<span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0" />
			)}
			{children}
		</button>
	);
}
