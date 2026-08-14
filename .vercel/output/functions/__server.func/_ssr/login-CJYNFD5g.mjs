import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as GROK_PROVIDERS } from "./router-Bc_V5q7-.mjs";
import { i as signIn, t as Button } from "./client-C7pcymKs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CJYNFD5g.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col bg-bg px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/",
			className: "inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-fg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Back"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-16 w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs uppercase tracking-[0.22em] text-subtle",
					children: "Origin"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-4xl font-medium tracking-tight",
					children: "Sign in"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Save lab sessions to your account."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 flex flex-col gap-3",
					children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "secondary",
						size: "lg",
						className: "w-full",
						onClick: () => signIn(p.providerId, { callbackURL: "/" }),
						children: ["Continue with ", p.label]
					}, p.providerId))
				})
			]
		})]
	});
}
//#endregion
export { Login as component };
