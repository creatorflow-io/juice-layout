export const environment = {
    production: true,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
    },
    // Host base for the idempotency demo. Mock scenario buttons hit `${base}/mock-api/*`;
    // the "Real backend" button (sendReal) hits the real `${base}/api/orders` endpoint.
    idempotencyDemoApi: "https://localhost:44311",
    auth: {
        issuer: 'https://host.docker.internal:44316/:tenant',
        redirectUri: 'https://localhost:4201/:tenant/auth/login-completed',
        postLogoutRedirectUri: 'https://localhost:4201/:tenant/auth/logout-completed',
        clientId: 'spa_demo',
        responseType: 'code',
        scope: 'openid profile roles tenants-api',
        basePath : 'https://localhost:4201/:tenant/auth'
    },
    layout:{
        brand: "cfio",
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
