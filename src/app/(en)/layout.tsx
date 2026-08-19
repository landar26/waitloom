import type { Metadata } from "next";
import { RootShell } from "@/components/root-shell";
import "../globals.css";

export const metadata: Metadata = {
	icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function EnLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <RootShell lang="en">{children}</RootShell>;
}
