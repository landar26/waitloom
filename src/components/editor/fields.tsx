"use client";

import { useRef, useState, type ReactNode } from "react";
import type { AppDict } from "@/i18n/app";

/** Form primitives for the editor panel. Plain, dense, and all controlled. */

const inputBase =
	"w-full rounded-lg border border-line bg-ink px-3 py-2 text-[13.5px] outline-none placeholder:text-dim focus:border-dim";

export function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className="block">
			<span className="text-[12px] uppercase tracking-[0.1em] text-dim">{label}</span>
			<div className="mt-1.5">{children}</div>
		</label>
	);
}

export function TextInput({
	value,
	onChange,
	placeholder,
	maxLength = 160,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	maxLength?: number;
}) {
	return (
		<input
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			maxLength={maxLength}
			className={inputBase}
		/>
	);
}

export function TextArea({
	value,
	onChange,
	placeholder,
	maxLength = 400,
	rows = 3,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	maxLength?: number;
	rows?: number;
}) {
	return (
		<textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			maxLength={maxLength}
			rows={rows}
			className={`${inputBase} resize-none`}
		/>
	);
}

export function Card({
	title,
	onRemove,
	removeLabel,
	children,
}: {
	title: string;
	onRemove?: () => void;
	removeLabel: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
			<div className="flex items-center justify-between gap-3">
				<span className="text-[12px] uppercase tracking-[0.1em] text-dim">{title}</span>
				{onRemove && (
					<button
						type="button"
						onClick={onRemove}
						className="text-[12px] text-dim transition-colors hover:text-brand-2"
					>
						{removeLabel}
					</button>
				)}
			</div>
			<div className="mt-3 space-y-2.5">{children}</div>
		</div>
	);
}

export function AddButton({
	label,
	onClick,
	disabled,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="w-full rounded-lg border border-dashed border-line px-3 py-2 text-[13px] text-dim transition-colors hover:border-dim hover:text-fg disabled:opacity-40 disabled:hover:border-line disabled:hover:text-dim"
		>
			+ {label}
		</button>
	);
}

/**
 * Upload to R2, or paste a URL. Founders rarely have an image already hosted,
 * so the upload is the primary path and the URL box is the escape hatch.
 */
export function ImageInput({
	projectId,
	value,
	onChange,
	dict,
}: {
	projectId: string;
	value: string;
	onChange: (url: string) => void;
	dict: AppDict;
}) {
	const t = dict.editor.fields;
	const input = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function upload(file: File) {
		setBusy(true);
		setError(null);
		try {
			const form = new FormData();
			form.append("file", file);
			form.append("projectId", projectId);

			const res = await fetch("/api/upload", { method: "POST", body: form });
			const data = (await res.json().catch(() => null)) as { url?: string } | null;

			if (!res.ok || !data?.url) throw new Error("upload failed");
			onChange(data.url);
		} catch {
			setError(t.uploadFailed);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div>
			<div className="flex items-center gap-2.5">
				{value && (
					/* eslint-disable-next-line @next/next/no-img-element */
					<img
						src={value}
						alt=""
						className="h-10 w-10 shrink-0 rounded-md border border-line object-cover"
					/>
				)}
				<button
					type="button"
					onClick={() => input.current?.click()}
					disabled={busy}
					className="rounded-lg border border-line px-3 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg disabled:opacity-50"
				>
					{busy ? t.uploading : t.upload}
				</button>
				{value && (
					<button
						type="button"
						onClick={() => onChange("")}
						className="text-[12px] text-dim transition-colors hover:text-brand-2"
					>
						{t.remove}
					</button>
				)}
				<input
					ref={input}
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) void upload(file);
						e.target.value = "";
					}}
				/>
			</div>

			<input
				type="url"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={t.orUrl}
				className={`${inputBase} mt-2`}
			/>

			{error && <p className="mt-1.5 text-[12px] text-brand-2">{error}</p>}
		</div>
	);
}
