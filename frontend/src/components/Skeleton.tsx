import { useId } from "react";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
	return <div className={`animate-pulse bg-surface-subtle rounded ${className}`} />;
}

export function CardSkeleton() {
	return (
		<div className="bg-surface rounded-xl shadow p-6 space-y-4">
			<Skeleton className="h-6 w-48" />
			<Skeleton className="h-4 w-32" />
			<div className="flex gap-6">
				<Skeleton className="h-16 w-24 rounded-lg" />
				<Skeleton className="h-16 w-24 rounded-lg" />
				<Skeleton className="h-16 w-24 rounded-lg" />
			</div>
		</div>
	);
}

function SkeletonRow() {
	return (
		<div className="px-6 py-4 flex gap-4">
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-4 w-16" />
			<Skeleton className="h-4 w-16" />
		</div>
	);
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
	const id = useId();
	return (
		<div className="bg-surface rounded-xl shadow overflow-hidden">
			<div className="p-6 border-b border-border">
				<Skeleton className="h-6 w-40" />
			</div>
			<div className="divide-y divide-gray-200">
				{Array.from({ length: rows }, (_, i) => (
					<SkeletonRow key={`${id}-${i}`} />
				))}
			</div>
		</div>
	);
}

function CourseCardSkeleton() {
	return (
		<div className="border border-border rounded-lg p-4 space-y-2">
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-10" />
			</div>
			<Skeleton className="h-4 w-48" />
		</div>
	);
}

export function CourseListSkeleton({ count = 5 }: { count?: number }) {
	const id = useId();
	return (
		<div className="space-y-2">
			{Array.from({ length: count }, (_, i) => (
				<CourseCardSkeleton key={`${id}-${i}`} />
			))}
		</div>
	);
}

export function CalendarSkeleton() {
	return (
		<div className="bg-surface rounded-xl shadow overflow-hidden">
			<div
				className="grid border-b border-border"
				style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}
			>
				<div className="p-2" />
				{["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
					<div key={d} className="p-2 text-center border-l border-border">
						<Skeleton className="h-4 w-8 mx-auto" />
					</div>
				))}
			</div>
			{[8, 9, 10, 11, 13, 14].map((hour) => (
				<div
					key={hour}
					className="grid border-b border-border-muted"
					style={{
						gridTemplateColumns: "64px repeat(5, 1fr)",
						minHeight: "72px",
					}}
				>
					<div className="p-2 flex justify-end pt-2">
						<Skeleton className="h-3 w-12" />
					</div>
					{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
						<div
							key={`${hour}-${day}`}
							className="border-l border-border-muted p-1"
						/>
					))}
				</div>
			))}
		</div>
	);
}
