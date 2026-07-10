import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService, TranslationObject } from '@ngx-translate/core';
import { CultureInfo, LocalizeService } from './localize.service';
import { Router } from '@angular/router';
import { UrlHelper } from './url-helper';

@Component({
    selector: 'juice-culture-select',
    templateUrl: './culture.component.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CultureComponent {
  Cultures: CultureInfo[] = [];
  culture!: string;
  constructor(private translate: TranslateService, 
    private localize: LocalizeService,
    private router: Router,
    private urlHelper: UrlHelper) {

    this.localize.fetchCultures().subscribe(cultures => {
      this.Cultures = cultures;
    });

    let storedCulture = localStorage.getItem('culture');
      console.debug("stored culture", storedCulture);
      this.culture = storedCulture ? storedCulture: (this.translate.getFallbackLang() ?? '');
      if(this.culture != this.translate.getCurrentLang()){
        localStorage.setItem('culture', this.culture);
      }
      
      this.router.events.subscribe((event) => {
        if(event.constructor.name == "NavigationEnd"){
          this.loadTranslation();
        }
      });
  }

  loadTranslation(){
    this.translate.use(this.culture);

    if(this.culture != this.translate.getFallbackLang()){
      console.debug("loading Translation", this.culture, this.urlHelper.page);

      this.localize.fetch(this.culture, this.urlHelper.page).subscribe((data) => {
        console.debug("loaded Translation", data);
        this.translate.setTranslation(this.culture, data as TranslationObject);
      });
    }
  }

  changeCulture(){
    localStorage.setItem('culture', this.culture);
    this.loadTranslation();
  }
}
