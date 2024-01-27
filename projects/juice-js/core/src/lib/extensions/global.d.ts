
export {};
declare global {
    interface String {
        trimStartSlash(): string;
        trimEndSlash(): string;
        trimSlash(): string;
        injectTenant(tenant: string|null|undefined): string;
    }
}