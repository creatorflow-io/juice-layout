import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalizeConfig } from './localize.config';
import { Observable } from 'rxjs';

export interface CultureInfo{
  key: string,
  displayName: string,
}

@Injectable({
  providedIn: 'root'
})
export class LocalizeService {

  constructor(private http:HttpClient, private options: LocalizeConfig) { }

  fetchCultures() {
    if(!this.options.cultureApi) return new Observable<CultureInfo[]>(function subscribe(observer) {});
    return this.http.get<CultureInfo[]>(this.options.cultureApi);
  }

  fetch(lang: string, page: string) {
    if(!this.options.localizeApi) return new Observable<Object>(function subscribe(observer) {});
    let scope = page.replace(/\//g, '.');
    var apiUrl = `${this.options.localizeApi}/${lang}/${scope}`;
    
    return this.http.get(apiUrl);
  }

  submit(page: string, appName: string, data: any) {
    if(this.options.submitMissing == false || !this.options.localizeApi) {
      return new Observable(function subscribe(observer) {
          observer.next(data);
          observer.complete();
      });
    }
    let scope = page.replace(/\//g, '.');
    var apiUrl = `${this.options.localizeApi}/${scope}/${appName}`;
    
    return this.http.post(apiUrl, data);
  }
}
