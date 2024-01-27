export const environment = {
    production: true,
    localize:{
        localizeApi: "https://localhost:44311/api/i18n",
        cultureApi: "https://localhost:44311/api/culture",
    },
    auth: {
        issuer: 'https://localhost:44310',
        redirectUri: 'https://localhost:4201/auth/login-completed',
        postLogoutRedirectUri: 'https://localhost:4201/auth/logout-completed',
        clientId: 'spa_demo',
        responseType: 'code',
        scope: 'openid profile roles offline_access localize_api',
        basePath : 'https://localhost:4201/auth',
    },
    layout:{
        brand: "cfio",
    },
    tenants: []
};
