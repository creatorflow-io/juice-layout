export const environment = {
    production: false,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
        appName: "testapp",
    },
    // Host base for the idempotency demo (Juice.Tests.Host). Mock scenario buttons hit
    // `${base}/mock-api/*`; the "Real backend" button (sendReal) hits the real
    // `${base}/api/orders` [Idempotent] endpoint, over the wire, so the Idempotency-Key
    // header and Retry-After hint are visible in DevTools.
    idempotencyDemoApi: "https://localhost:7226",
    auth: {
        issuer: 'https://host.docker.internal:44316/:tenant',
        redirectUri: 'https://localhost:4201/:tenant/auth/login-completed',
        postLogoutRedirectUri: 'https://localhost:4201/:tenant/auth/logout-completed',
        clientId: 'spa_demo',
        responseType: 'code',
        scope: 'openid profile roles tenants-api',
        basePath : 'https://localhost:4201/:tenant/auth',
    },
    layout:{
        brand: "cfio",
        defaultMenuOpen: true,
        userImageUrl: "https://i.pravatar.cc/300"// "https://host.docker.internal:44316/Account/Auth/ProfileImage?username={username}"
    },
    tenants: [
        {
            identifier: "acme",
            name: "Acme",
        },
        {
            identifier: "initech",
            name: "CFIO",
        }
    ]
};
