"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders a full-width page at its real design width and scales it down to fit
 * the panel. The alternative — an iframe — would need a save round-trip before
 * the founder could see an edit.
 */
export function ScaledFrame({
	width,
	children,
}: {
	width: number;
	children: ReactNode;
}) {
	const outer = useRef<HTMLDivElement>(null);
	const inner = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(0);
	const [height, setHeight] = useState(0);

	useLayoutEffect(() => {
		const outerEl = outer.current;
		const innerEl = inner.current;
		if (!outerEl || !innerEl) return;

		const measure = () => {
			setScale(outerEl.clientWidth / width);
			setHeight(innerEl.scrollHeight);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(outerEl);
		observer.observe(innerEl);
		return () => observer.disconnect();
	}, [width]);

	return (
		<div
			ref={outer}
			className="w-full overflow-hidden"
			// Zero until measured, so the page does not flash at full size.
			style={{ height: height * scale }}
		>
			<div
				ref={inner}
				style={{
					width,
					transform: `scale(${scale || 0.0001})`,
					transformOrigin: "top left",
				}}
			>
				{children}
			</div>
		</div>
	);
}
