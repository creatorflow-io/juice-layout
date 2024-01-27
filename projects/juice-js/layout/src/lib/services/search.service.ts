import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SearchService{
    isEnabled: boolean = false;
    private _callback: Function | undefined = undefined;

    constructor(private router: Router){
        router.events.subscribe((event) => {
            if(event instanceof NavigationStart){
                this.disable();
            }
        });
    }

    public disable(){
        this.isEnabled = false;
        this._callback = undefined;
    }

    public enable(callback: Function){
        this.isEnabled = true;
        this._callback = callback;
    }

    public callback(searchText: string|null, event: any){
        if(this._callback){
            this._callback(searchText, event);
        }
    }
}