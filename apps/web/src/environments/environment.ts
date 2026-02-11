declare global {
  interface Window { __env: any; }
}

export const environment = {
  production: false,
  apiUrl: window.__env?.API_URL || '/api',
  keycloak: {
    url: window.__env?.KEYCLOAK_URL || 'http://localhost:8080',
    realm: window.__env?.KEYCLOAK_REALM || 'osci',
    clientId: window.__env?.KEYCLOAK_CLIENT_ID || 'osci-web',
  },
};
