export class AuthModuleConfig{
    basePath: string = "";

    /**
     * Base URLs the AuthInterceptor sends the bearer token to; a request matches when its URL equals one of them or
     * continues it with `/` or `?`. An empty string matches relative URLs.
     *
     * Unset: the app's own origin only (relative URLs and `window.location.origin`), so the identity server, CDNs
     * and third-party APIs never see the token. List every API host the app calls with the token.
     *
     * `['*']` restores the pre-2.0 behaviour — the token on every request, whatever the host. A migration aid only:
     * it leaks the token to any host the app happens to call.
     */
    allowedUrls?: string[];

    /**
     * Renew the access token with the refresh token shortly before it expires (needs the `offline_access` scope).
     * Default false: an app that renews the token itself (e.g. `@hd/layout`'s `provideHdStation`) must not do it twice,
     * or a rotating refresh token is redeemed twice and the second request fails.
     */
    automaticRefresh?: boolean;
}
