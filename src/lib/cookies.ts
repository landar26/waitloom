/**
 * Cookie names live apart from the modules that use them: middleware runs on
 * the edge runtime and must not pull in `next/headers` or the D1 client just to
 * learn what a cookie is called.
 */
export const SESSION_COOKIE = "wl_session";
export const OAUTH_STATE_COOKIE = "wl_oauth_state";
export const LANG_COOKIE = "wl_lang";
