import { ImageResponse } from "next/og";

export const ogAlt = "Waitloom — Launch before you launch";
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function ogImageResponse() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					background: "#09090b",
					padding: 72,
					fontFamily: "sans-serif",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<svg width="44" height="44" viewBox="0 0 24 24" fill="none">
						<path
							d="M5 3v18M12 3v18M19 3v18"
							stroke="#ff8a3d"
							strokeOpacity="0.4"
							strokeWidth="1.6"
						/>
						<path
							d="M3 8.5c3 0 3 3 6 3s3-3 6-3 3 3 6 3"
							stroke="#ff8a3d"
							strokeWidth="2"
						/>
						<path
							d="M3 15.5c3 0 3-3 6-3s3 3 6 3 3-3 6-3"
							stroke="#ff8a3d"
							strokeOpacity="0.6"
							strokeWidth="2"
						/>
					</svg>
					<span style={{ color: "#f2f2f4", fontSize: 34, fontWeight: 600 }}>
						Waitloom
					</span>
				</div>

				<div style={{ display: "flex", flexDirection: "column" }}>
					<span
						style={{
							color: "#f2f2f4",
							fontSize: 82,
							fontWeight: 700,
							letterSpacing: -2.5,
							lineHeight: 1.05,
						}}
					>
						Launch before you launch.
					</span>
					<span
						style={{
							marginTop: 26,
							color: "#a4a4ae",
							fontSize: 32,
							lineHeight: 1.4,
							maxWidth: 900,
						}}
					>
						A pre-launch page, a waitlist and idea validation — in minutes.
					</span>
				</div>

				<div style={{ display: "flex", gap: 28, color: "#6e6e78", fontSize: 26 }}>
					<span>No Carrd.</span>
					<span>No Mailchimp.</span>
					<span>No Zapier.</span>
				</div>
			</div>
		),
		ogSize,
	);
}
