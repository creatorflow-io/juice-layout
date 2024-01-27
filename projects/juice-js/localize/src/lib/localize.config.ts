export class LocalizeConfig{
    submitMissing: boolean = false;
    appName: string = ''; // used for submit missing translation
    localizeApi: string = '';
    cultureApi: string = '';
}
export interface ILocalizeConfig{
    submitMissing?: boolean;
    appName?: string;
    localizeApi: string;
    cultureApi: string;
}