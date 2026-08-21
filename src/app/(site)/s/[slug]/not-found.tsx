import { pageEn } from "@/i18n/page";

/** An unclaimed subdomain should still look like it belongs to something. */
export default function NotFound() {
	const t = pageEn.notFound;

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-center text-[#f2f2f4]">
			<div>
				<p className="text-[13px] uppercase tracking-[0.16em] text-[#6e6e78]">
					Waitloom
				</p>
				<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
					{t.title}
				</h1>
				<p className="mt-3 text-[15px] text-[#a4a4ae]">{t.body}</p>
				<a
					href="https://waitloom.app"
					className="mt-7 inline-flex rounded-full bg-[#ff8a3d] px-5 py-2.5 text-[14px] font-medium text-[#1a0d05]"
				>
					{t.cta}
				</a>
			</div>
		</main>
	);
}
