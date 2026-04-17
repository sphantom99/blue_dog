interface CourseFiltersProps {
	search: string;
	onSearch: (v: string) => void;
	typeFilter: string;
	onTypeFilter: (v: string) => void;
}

export default function CourseFilters({
	search,
	onSearch,
	typeFilter,
	onTypeFilter,
}: CourseFiltersProps) {
	return (
		<div className="shrink-0 bg-surface z-10 p-4 border-b border-border-muted space-y-3">
			<input
				type="text"
				placeholder="Search courses..."
				value={search}
				onChange={(e) => onSearch(e.target.value)}
				className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
			/>
			<div className="flex gap-2">
				{(["all", "core", "elective"] as const).map((t) => (
					<button
						type="button"
						key={t}
						onClick={() => onTypeFilter(t)}
						className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${typeFilter === t
								? "bg-primary-600 text-white"
								: "bg-surface-subtle text-text-muted hover:bg-surface-subtle"
							}`}
					>
						{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
					</button>
				))}
			</div>
		</div>
	);
}
