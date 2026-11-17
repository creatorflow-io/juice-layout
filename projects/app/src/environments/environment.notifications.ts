// `ng serve -c notifications`: the demo app against the Juice.Notifications local stack.
export const environment = {
    production: false,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
        appName: "testapp",
    },
    // Juice.Notifications' local stack (services/notifications/deploy/local): its Keycloak signs people in (ann or ben, password
    // PEOPLE_TEST_PASSWORD in its .env), and the notification bell reads its API.
    notificationsApi: "http://localhost:5280",
    // Host base for the idempotency demo (Juice.Tests.Host). Mock scenario buttons hit
    // `${base}/mock-api/*`; the "Real backend" button (sendReal) hits the real
    // `${base}/api/orders` [Idempotent] endpoint, over the wire, so the Idempotency-Key
    // header and Retry-After hint are visible in DevTools.
    idempotencyDemoApi: "https://localhost:7226",
    auth: {
        issuer: 'http://localhost:8081/realms/juice',
        redirectUri: 'https://localhost:4201/:tenant/auth/login-completed',
        postLogoutRedirectUri: 'https://localhost:4201/:tenant/auth/logout-completed',
        clientId: 'juice-layout-demo',
        responseType: 'code',
        // The local realm has no profile scope; juice-notifications carries the API's audience and roles.
        scope: 'openid juice-notifications',
        basePath : 'https://localhost:4201/:tenant/auth',
        // The APIs that get the bearer token (default: this app's origin only).
        allowedUrls: ['', 'http://localhost:5280'],
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
