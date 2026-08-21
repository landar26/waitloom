export const LANGS = ["en", "zh"] as const;
export type Lang = (typeof LANGS)[number];

/** Each language named in itself — a switcher is read by people who want out. */
export const LANG_LABELS: Record<Lang, string> = { en: "English", zh: "中文" };

/** The short form, for tight spots like a published page's header. */
export const LANG_SHORT: Record<Lang, string> = { en: "EN", zh: "中文" };

export const PRODUCT_TYPES = [
	"saas",
	"ai",
	"ios",
	"macos",
	"android",
	"devtool",
	"extension",
	"game",
	"other",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const en = {
	meta: {
		title: "Waitloom — Launch before you launch",
		description:
			"Create a beautiful pre-launch page, validate your idea, and grow your first audience — in minutes. No Carrd. No Mailchimp. No Zapier.",
		ogTagline: "Launch before you launch.",
	},
	nav: {
		templates: "Templates",
		features: "Features",
		mcp: "MCP",
		faq: "FAQ",
		cta: "Join waitlist",
		ctaApp: "Create your page",
		signIn: "Sign in",
		langLabel: "中文",
		langHref: "/zh",
	},
	hero: {
		badge: "Live · built in public",
		title: "Launch before you launch.",
		subtitle:
			"Create a beautiful pre-launch page, validate your idea, and grow your first audience — in minutes.",
		chips: ["No Carrd.", "No Mailchimp.", "No Zapier."],
		flow: ["Create", "Publish", "Share", "Collect", "Validate"],
	},
	form: {
		placeholder: "you@example.com",
		join: "Join waitlist",
		joining: "Joining…",
		note: "Free when it launches. One email the day it's live — nothing else.",
		errInvalid: "That doesn't look like an email address.",
		errGeneric: "Something went wrong. Try again?",
		errRate: "Too many signups from here. Try again in a bit.",
		qIntro: "Two quick questions — they decide what I build first.",
		optional: "Optional",
		q1: "What are you building?",
		q2: "What's the hardest part of your pre-launch right now?",
		q2Placeholder: "One sentence is plenty.",
		skip: "Skip",
		done: "Done",
		saving: "Saving…",
		successTitle: "You're on the list 🎉",
		successPosition: "You're #{n}.",
		successBody:
			"I'll email you the day Waitloom goes live, with early access before it opens up.",
		shareTitle: "Know someone shipping something?",
		copy: "Copy link",
		copied: "Copied",
		shareX: "Share on X",
		shareReddit: "Share on Reddit",
		shareText:
			"Launch before you launch — Waitloom puts your pre-launch page, waitlist and idea validation in one place:",
	},
	productTypes: {
		saas: "SaaS",
		ai: "AI Tool",
		ios: "iOS App",
		macos: "macOS App",
		android: "Android App",
		devtool: "Developer Tool",
		extension: "Chrome Extension",
		game: "Game",
		other: "Something else",
	},
	templates: {
		eyebrow: "Templates",
		title: "Six templates. All of them good.",
		subtitle:
			"You pick a style, not a layout. Every template is tuned for signups — and none of them can be made ugly.",
		items: [
			{ id: "minimal", name: "Minimal", for: "SaaS · Productivity · Micro SaaS" },
			{ id: "apple", name: "Apple", for: "iOS · macOS · Consumer app" },
			{ id: "developer", name: "Developer", for: "API · CLI · Open source" },
			{ id: "ai", name: "AI", for: "AI SaaS · Agents · AI tools" },
			{ id: "dark", name: "Dark", for: "Developer · AI · Security" },
			{ id: "playful", name: "Playful", for: "Consumer · Social · Games" },
		],
	},
	features: {
		eyebrow: "Features",
		title: "Everything you need before launch.",
		subtitle:
			"And deliberately nothing you don't. It doesn't expire on launch day " +
			"either — point the button at your product and the same page keeps going.",
		items: [
			{
				title: "Beautiful page",
				body: "Six hand-built templates and a block editor with just enough knobs. It looks designed on every screen, without you touching a breakpoint.",
				tag: "",
			},
			{
				title: "Waitlist",
				body: "Collect emails with source, referrer and UTM attached. Search the list, view answers, export CSV whenever you want.",
				tag: "",
			},
			{
				title: "Idea validation",
				body: "Ask up to three optional questions at signup. Learn who is signing up and what they actually need — before you write the code.",
				tag: "",
			},
			{
				title: "Analytics",
				body: "Visitors, signups, conversion, traffic sources. The four numbers that matter before launch, and no dashboard to configure.",
				tag: "",
			},
			{
				title: "Custom domain",
				body: "Coming next: point launch.yourproduct.com at your page, with SSL and domain verification handled for you. Today every page lives on its own waitloom.app subdomain.",
				tag: "Coming soon",
			},
			{
				title: "MCP support",
				body: "Create, edit and publish your page from Claude Code or Cursor — and have your agent read the signup numbers straight back to you.",
				tag: "",
			},
		],
	},
	mcp: {
		eyebrow: "Model Context Protocol",
		title: "Ship your page without leaving your editor.",
		body: "Waitloom speaks MCP. Drop the server into Claude Code, Cursor, or any MCP client, and your agent can spin up a pre-launch page, publish it to a subdomain, and pull today's signups — from the terminal you already have open.",
		bullets: [
			"create_project · update_page · set_questions · publish · list_subscribers · get_stats",
			"No tab-switching to a dashboard while you're deep in code",
			"Works with any MCP-compatible client",
		],
		note: "Create a token under MCP in your dashboard, then add the server:",
		badge: "Live",
	},
	faq: {
		eyebrow: "FAQ",
		title: "Questions you'd reasonably have.",
		items: [
			{
				q: "How is this different from Carrd or Framer?",
				a: "Those build websites. Waitloom builds one specific thing — a pre-launch page — and then does the parts they leave to you: the waitlist, the validation questions, the signup analytics, the CSV. No Mailchimp, no Zapier, no glue in between.",
			},
			{
				q: "What do I get for free?",
				a: "Everything, while it's in beta — unlimited projects and unlimited subscribers, each page on its own yourname.waitloom.app subdomain, with the waitlist, the validation questions and the analytics. Paid plans show up when the free tier starts costing me real money.",
			},
			{
				q: "Can I use my own domain?",
				a: "Not yet. Every page gets a yourname.waitloom.app subdomain today, and custom domains are the next thing on the list.",
			},
			{
				q: "What happens to my page after I launch?",
				a: "It keeps working. Switch the button from the email form to a link — your App Store page, your download, your sign-up — and the waitlist section becomes optional. Add a pricing block if you have one. Same URL, same page, now doing the job of a small official site while the product is still finding its first users.",
			},
			{
				q: "Who owns the emails I collect?",
				a: "You do. Export the full list as CSV any time, answers to your validation questions included. We never email your subscribers on our own.",
			},
			{
				q: "How long does it take to put a page up?",
				a: "Under ten minutes if you already know what your product does. Name it, describe it in a sentence, pick a template, edit the parts you care about, publish. It is live on its subdomain the moment you hit publish.",
			},
		],
	},
	discord: {
		eyebrow: "Feedback",
		title: "Something broken, or missing?",
		body: "Waitloom is early, and the fastest way to get something fixed is to say it out loud. Bug reports, missing features, half-formed ideas — the Discord is where they land, and where you can see what I'm working on next.",
		cta: "Join the Discord",
		footer: "Discord",
	},
	founder: {
		eyebrow: "Who's building this",
		title: "One developer, working in the open.",
		body: "I've built the same throwaway launch page too many times — Carrd for the page, Tally for the questions, a spreadsheet for the emails, and a Zap holding it all together. Waitloom is that stack collapsed into one page you can put up before the product exists. The first version is live, and I'm still building it in the open.",
		link: "Follow along on X",
		linkHref: "https://x.com/landarX",
	},
	closing: {
		title: "Put something up before you write the code.",
		subtitle: "Join the waitlist and be there on day one.",
		subtitleLive: "Create your page, publish it, and start collecting today.",
	},
	footer: {
		privacy:
			"The subscribers you collect are yours. Export them as CSV any time; we never email them on our own.",
		rights: "Waitloom. Built in public.",
	},
} ;

export type Dict = typeof en;

export const zh: Dict = {
	meta: {
		title: "Waitloom — 在发布之前，先发布",
		description:
			"几分钟做出一个漂亮的预发布页面，验证你的想法，攒下第一批用户。不用 Carrd，不用 Mailchimp，不用 Zapier。",
		ogTagline: "在发布之前，先发布。",
	},
	nav: {
		templates: "模板",
		features: "功能",
		mcp: "MCP",
		faq: "常见问题",
		cta: "加入 Waitlist",
		ctaApp: "创建你的页面",
		signIn: "登录",
		langLabel: "EN",
		langHref: "/",
	},
	hero: {
		badge: "已上线 · 公开地做",
		title: "在发布之前，先发布。",
		subtitle:
			"几分钟做出一个漂亮的预发布页面，验证你的想法，攒下第一批用户。",
		chips: ["不用 Carrd。", "不用 Mailchimp。", "不用 Zapier。"],
		flow: ["创建", "发布", "分享", "收集", "验证"],
	},
	form: {
		placeholder: "you@example.com",
		join: "加入 Waitlist",
		joining: "提交中…",
		note: "上线时免费。只在上线当天发一封邮件，不发别的。",
		errInvalid: "这看起来不是一个邮箱地址。",
		errGeneric: "出了点问题，再试一次？",
		errRate: "提交得有点频繁，过一会儿再试。",
		qIntro: "两个小问题，直接决定我先做哪个功能。",
		optional: "选填",
		q1: "你在做什么产品？",
		q2: "现在预发布这件事上，最难的是哪一步？",
		q2Placeholder: "一句话就够。",
		skip: "跳过",
		done: "完成",
		saving: "保存中…",
		successTitle: "你已经在名单上了 🎉",
		successPosition: "你是第 #{n} 位。",
		successBody:
			"Waitloom 上线当天我会给你发一封邮件，并在正式开放前给你早期访问。",
		shareTitle: "认识也在做产品的人？",
		copy: "复制链接",
		copied: "已复制",
		shareX: "分享到 X",
		shareReddit: "分享到 Reddit",
		shareText:
			"在发布之前，先发布 —— Waitloom 把预发布页面、Waitlist 和需求验证放在了一起：",
	},
	productTypes: {
		saas: "SaaS",
		ai: "AI 工具",
		ios: "iOS App",
		macos: "macOS App",
		android: "Android App",
		devtool: "开发者工具",
		extension: "Chrome 插件",
		game: "游戏",
		other: "其他",
	},
	templates: {
		eyebrow: "模板",
		title: "六个模板，个个能打。",
		subtitle:
			"你挑的是风格，不是布局。每个模板都为注册转化调过，而且怎么改都不会变丑。",
		items: [
			{ id: "minimal", name: "Minimal", for: "SaaS · 效率工具 · Micro SaaS" },
			{ id: "apple", name: "Apple", for: "iOS · macOS · 消费级 App" },
			{ id: "developer", name: "Developer", for: "API · CLI · 开源项目" },
			{ id: "ai", name: "AI", for: "AI SaaS · Agent · AI 工具" },
			{ id: "dark", name: "Dark", for: "开发者 · AI · 安全" },
			{ id: "playful", name: "Playful", for: "消费级 · 社交 · 游戏" },
		],
	},
	features: {
		eyebrow: "功能",
		title: "上线之前需要的，这里都有。",
		subtitle:
			"不需要的，一个也不给。上线那天它也不会作废 —— 把按钮指向你的产品，同一个页面继续用。",
		items: [
			{
				title: "漂亮的页面",
				body: "六套手工打磨的模板，加一个刚刚好的区块编辑器。不用碰断点，页面在任何屏幕上都像被认真设计过。",
				tag: "",
			},
			{
				title: "Waitlist",
				body: "收邮箱的同时带上来源、referrer 和 UTM。可以搜索名单、查看答案，随时导出 CSV。",
				tag: "",
			},
			{
				title: "需求验证",
				body: "注册时最多问三个选填问题。在写代码之前就知道来的是谁、他们真正要的是什么。",
				tag: "",
			},
			{
				title: "数据分析",
				body: "访客、注册、转化、流量来源。上线前只有这四个数字重要，也不需要你配任何东西。",
				tag: "",
			},
			{
				title: "自定义域名",
				body: "接下来会做：把 launch.yourproduct.com 指过来，SSL 和域名验证自动完成。目前每个页面都有自己的 waitloom.app 子域名。",
				tag: "即将上线",
			},
			{
				title: "支持 MCP",
				body: "在 Claude Code、Cursor 里直接建页面、改页面、发布，还能让 agent 把注册数据直接读回来给你。",
				tag: "",
			},
		],
	},
	mcp: {
		eyebrow: "Model Context Protocol",
		title: "不用离开编辑器，就能把页面发出去。",
		body: "Waitloom 原生支持 MCP。把 server 装进 Claude Code、Cursor 或任意 MCP 客户端，你的 agent 就能建好预发布页面、发布到子域名、拉取今天的注册数据 —— 全都在你本来就开着的终端里完成。",
		bullets: [
			"create_project · update_page · set_questions · publish · list_subscribers · get_stats",
			"写代码写到一半，不用切去开后台",
			"兼容任意 MCP 客户端",
		],
		note: "在后台的 MCP 页面创建一个 token，然后把 server 加进去：",
		badge: "已上线",
	},
	faq: {
		eyebrow: "常见问题",
		title: "你大概会想问的几件事。",
		items: [
			{
				q: "和 Carrd、Framer 有什么区别？",
				a: "它们是用来建网站的。Waitloom 只做一件具体的事 —— 预发布页面 —— 然后把它们留给你自己解决的那部分做掉：waitlist、验证问题、注册数据、CSV 导出。不用 Mailchimp，不用 Zapier，中间不需要胶水。",
			},
			{
				q: "免费版能用什么？",
				a: "Beta 期间全都能用 —— project 不限个数，订阅者不限数量，每个页面有自己的 yourname.waitloom.app 子域名，含 waitlist、验证问题和数据面板。等免费额度开始真的花我钱了，才会有付费版。",
			},
			{
				q: "能绑我自己的域名吗？",
				a: "还不行。目前每个页面都有自己的 yourname.waitloom.app 子域名，自定义域名是接下来要做的第一件事。",
			},
			{
				q: "产品上线之后这个页面怎么办？",
				a: "继续用。把按钮从邮箱表单换成一个链接 —— App Store、下载地址、注册入口都行 —— 等待名单板块就变成可选的了。有价格的话再打开价格板块。同一个网址、同一个页面，在产品还在找最初那批用户的阶段，它就是一个够用的官网。",
			},
			{
				q: "收集到的邮箱归谁？",
				a: "归你。随时导出完整 CSV，包含验证问题的答案。我们不会以自己的名义给你的订阅者发任何邮件。",
			},
			{
				q: "做一个页面要多久？",
				a: "如果你已经清楚自己在做什么，十分钟以内。起个名字，一句话描述它，挑一个模板，改你在意的那几处，然后发布。点下发布的那一刻，页面就在子域名上活着了。",
			},
		],
	},
	discord: {
		eyebrow: "问题反馈",
		title: "哪里坏了，或者少了什么？",
		body: "Waitloom 还很早，想让一个问题被修掉，最快的方式就是说出来。Bug、缺的功能、还没想清楚的点子，都可以丢进 Discord，那里也能看到我接下来在做什么。",
		cta: "加入 Discord",
		footer: "Discord",
	},
	founder: {
		eyebrow: "谁在做这个",
		title: "一个开发者，公开地做。",
		body: "同一套一次性落地页我已经重复搭过太多次 —— Carrd 做页面，Tally 收问题，表格存邮箱，再拿一个 Zap 把它们粘在一起。Waitloom 就是把这一整套压缩成一个页面，让你在产品还不存在的时候就能挂出去。第一版已经上线了，后面我会继续公开地做。",
		link: "在 X 上关注进展",
		linkHref: "https://x.com/landarX",
	},
	closing: {
		title: "在写代码之前，先把东西挂出去。",
		subtitle: "加入 Waitlist，上线第一天就在场。",
		subtitleLive: "创建你的页面，发布出去，今天就开始收集用户。",
	},
	footer: {
		privacy: "你收集到的订阅者归你。随时导出 CSV，我们不会以自己的名义给他们发任何邮件。",
		rights: "Waitloom. 公开地做。",
	},
};

export const dictionaries: Record<Lang, Dict> = { en, zh };

export function getDict(lang: Lang): Dict {
	return dictionaries[lang];
}
