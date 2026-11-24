export interface TenantInfo{
    /** The name in the app's URL (`/acme/...`): for routing and display only. */
    identifier: string;
    /**
     * The tenant's Id from juice-tenants, a GUID: what Juice services take (the tenant pattern, juice-docs decision record). A resolver that
     * knows it sets it; none means the app knows the tenant only by its name.
     */
    id?: string;
    name: string;
    description?: string;
    logo?: string;
    favicon?: string;
    theme?: string;
    resolvedBy?: string;
}
