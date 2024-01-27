export const environment = {
    production: false,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
        appName: "testapp",
    },
    auth: {
        issuer: 'https://localhost:44310',
        redirectUri: 'https://localhost:4201/auth/login-completed',
        postLogoutRedirectUri: 'https://localhost:4201/auth/logout-completed',
        clientId: 'spa_demo',
        responseType: 'code',
        scope: 'openid profile roles offline_access localize_api',
        basePath : 'https://localhost:4201/:tenant/auth',
    },
    layout:{
        brand: "cfio",
        defaultMenuOpen: true,
        userImageUrl: "https://localhost:44310/Account/Auth/ProfileImage?username={username}"
    },
    tenants: [
        {
            identifier: "acme",
            name: "Acme",
        },
        {
            identifier: "cfio",
            name: "CFIO",
        }
    ]
};
