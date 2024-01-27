
String.prototype.trimStartSlash = function (): string{
    return this.replace(/^[\/]+/, '');
}
String.prototype.trimEndSlash = function (): string{
    return this.replace(/[\/]+$/, '');
}
String.prototype.trimSlash = function (): string{
    return this.trimStartSlash().trimEndSlash();
}
String.prototype.injectTenant = function (tenant: string|null|undefined): string{
    return '/' + this.replace(':tenant', tenant??'').trimStartSlash();
}
