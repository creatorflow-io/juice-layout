export const environment = {
    production: true,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
    },
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
