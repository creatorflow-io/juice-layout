export const environment = {
    production: false,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
        appName: "testapp",
    },
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
        userImageUrl: "https://host.docker.internal:44316/Account/Auth/ProfileImage?username={username}"
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
