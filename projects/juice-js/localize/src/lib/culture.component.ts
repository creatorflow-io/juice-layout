import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CultureInfo, LocalizeService } from './localize.service';
import { Router } from '@angular/router';
import { UrlHelper } from './url-helper';

@Component({
  selector: 'juice-culture-select',
  templateUrl: './culture.component.html',
  styles: [
  ]
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
      this.culture = storedCulture ? storedCulture: this.translate.defaultLang;
      if(this.culture != this.translate.currentLang){
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

    if(this.culture != this.translate.defaultLang){
      console.debug("loading Translation", this.culture, this.urlHelper.page);

      this.localize.fetch(this.culture, this.urlHelper.page).subscribe((data) => {
        console.debug("loaded Translation", data);
        this.translate.setTranslation(this.culture, data);
      });
    }
  }

  changeCulture(){
    localStorage.setItem('culture', this.culture);
    this.loadTranslation();
  }
}
