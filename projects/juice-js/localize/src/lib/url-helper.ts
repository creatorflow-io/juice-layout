
import {Injectable} from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class UrlHelper {
  url!: string;
  page!: string;

  constructor(private router: Router) {
    this.url = this.getCurrentUrl();
    this.page = this.trimSlash(this.url.split('?')[0]);
    this.router.events.subscribe((event) => {
      this.url = this.getCurrentUrl();
      this.page = this.trimSlash(this.url.split('?')[0]);
    });
  }

  getCurrentUrl(): string {
    return this.router.url;
  }

  trimSlash(url: string): string {
    if (url.startsWith('/')) {
      url = url.substring(1);
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    return url;
  }
}