import {TranslateLoader} from "@ngx-translate/core";
import {Observable, map} from 'rxjs';
import { UrlHelper } from "./url-helper";
import { LocalizeService } from "./localize.service";

export class ScopedTranslateApiLoader implements TranslateLoader {
  constructor(private service: LocalizeService, 
    private urlHelper: UrlHelper
    ) {

    }

  /**
   * Gets the translations from the server
   */
  public getTranslation(lang: string): Observable<Object> {
    console.log("loading translation", lang, this.urlHelper.page);
    return this.service.fetch(lang, this.urlHelper.page);;
  }

}