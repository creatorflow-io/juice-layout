import {Injectable} from "@angular/core";
import {MissingTranslationHandler, MissingTranslationHandlerParams} from "@ngx-translate/core";
import { timer } from "rxjs";
import { LocalizeService } from "./localize.service";
import { UrlHelper } from "./url-helper";
import { LocalizeConfig } from "./localize.config";


@Injectable()
export class SubmitMissingTranslationHandler implements MissingTranslationHandler {

  keys: Array<string> = [];
  lastUpdate: Date = new Date();
  constructor(private service: LocalizeService, 
    private options: LocalizeConfig,
    private urlHeper: UrlHelper) {
  }

  handle(params: MissingTranslationHandlerParams): string {
    if(this.keys.indexOf(params.key) < 0 && params.translateService.currentLang != undefined
      && params.translateService.currentLang != params.translateService.defaultLang
    ){
      console.debug("missing translation", params.translateService.currentLang, params.key);
      this.keys.push(params.key);
      timer(500).subscribe(()=>this.checkForSubmit());
    }
    return params.key;
  }

  checkForSubmit(){
    if(!this.lastUpdate || new Date().getTime() - this.lastUpdate.getTime()>500){
      this.lastUpdate = new Date();
      this.submit();
    }
  }
  submit(){
    if(this.keys.length > 0){
      let keys = this.keys;
      this.keys = [];
      var appName = this.options.appName;
      var page = this.urlHeper.page;
      
      this.service.submit(page, appName, keys)
        .subscribe({
          next: (data) => {
              console.debug("submited missing translation", data);
          },
          error: (error) => {
            if(error.error && error.error == "Not supported by server configuration"){
              console.debug(error.error);
            }else{
              console.error("error submiting missing translation", error);
            }
          }
        });
    }
  }
}