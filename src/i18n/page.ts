import type { Lang } from "./dictionaries";

/**
 * Microcopy for a published page, keyed by the language the page is currently
 * being read in — which is the founder's own language until they translate the
 * page, and the visitor's negotiated one after that. Either way the form and
 * the copy above it always speak the same language.
 */
export const pageEn = {
	sections: {
		features: "What you get",
		howItWorks: "How it works",
		faq: "Questions",
		founder: "Who's building this",
		waitlist: "Get early access",
		waitlistSubtitle: "Be the first to know when it launches.",
	},
	form: {
		placeholder: "you@example.com",
		join: "Join waitlist",
		joining: "Joining…",
		errInvalid: "That doesn't look like an email address.",
		errGeneric: "Something went wrong. Try again?",
		errRate: "Too many signups from here. Try again in a bit.",
		errFull: "The waitlist is full right now.",
		qIntro: "One or two quick questions — they're optional.",
		optional: "Optional",
		skip: "Skip",
		done: "Done",
		saving: "Saving…",
		successTitle: "You're on the list 🎉",
		successPosition: "You're #{n}.",
		successBody: "We'll let you know the moment it's live.",
		alreadyIn: "You're already on the list.",
		previewNote: "Preview — signups are disabled here.",
	},
	switcher: {
		label: "Language",
	},
	footer: {
		madeWith: "Made with Waitloom",
	},
	notFound: {
		title: "This page isn't live yet",
		body: "Nobody has published anything at this address.",
		cta: "Claim it on Waitloom",
	},
};

export type PageDict = typeof pageEn;

export const pageZh: PageDict = {
	sections: {
		features: "你会得到什么",
		howItWorks: "如何使用",
		faq: "常见问题",
		founder: "关于开发者",
		waitlist: "抢先体验",
		waitlistSubtitle: "上线第一时间通知你。",
	},
	form: {
		placeholder: "you@example.com",
		join: "加入等待名单",
		joining: "提交中…",
		errInvalid: "这看起来不像一个邮箱地址。",
		errGeneric: "出了点问题，再试一次？",
		errRate: "提交太频繁了，请稍后再试。",
		errFull: "等待名单暂时已满。",
		qIntro: "一两个小问题 —— 可以跳过。",
		optional: "选填",
		skip: "跳过",
		done: "完成",
		saving: "保存中…",
		successTitle: "你已经在名单上了 🎉",
		successPosition: "你是第 {n} 位。",
		successBody: "上线的那一刻就会通知你。",
		alreadyIn: "你已经在名单上了。",
		previewNote: "预览模式 —— 这里无法真正提交。",
	},
	switcher: {
		label: "语言",
	},
	footer: {
		madeWith: "由 Waitloom 制作",
	},
	notFound: {
		title: "这个页面还没有上线",
		body: "还没有人在这个地址发布内容。",
		cta: "去 Waitloom 认领",
	},
};

export const pageDicts: Record<Lang, PageDict> = { en: pageEn, zh: pageZh };

export function getPageDict(lang: string): PageDict {
	return lang === "zh" ? pageZh : pageEn;
}
