export function Logo({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			{/* warp */}
			<path
				d="M5 3v18M12 3v18M19 3v18"
				stroke="currentColor"
				strokeOpacity="0.35"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			{/* weft, woven over and under */}
			<path
				d="M3 8.5c3 0 3 3 6 3s3-3 6-3 3 3 6 3"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<path
				d="M3 15.5c3 0 3-3 6-3s3 3 6 3 3-3 6-3"
				stroke="currentColor"
				strokeOpacity="0.55"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
		</svg>
	);
}
