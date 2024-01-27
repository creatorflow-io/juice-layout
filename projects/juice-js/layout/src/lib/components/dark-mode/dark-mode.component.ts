import { Component, OnInit} from '@angular/core';
import { LayoutService } from '../../layout.service';
import { ThemeMode } from '../../layout.config';

@Component({
  selector: 'juice-dark-mode',
  templateUrl: './dark-mode.component.html',
})
export class DarkModeComponent{
  ThemeMode: typeof ThemeMode = ThemeMode;
  prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  constructor(private service: LayoutService) { 
    this.prefersDark.addEventListener("change", e => {
      this.initTheme(e.matches);
    });
    this.initTheme(this.prefersDark.matches);
  }
  icons = new Map<ThemeMode, string>([
    [ThemeMode.Light, "light_mode"],
    [ThemeMode.Dark, "dark_mode"],
    [ThemeMode.Auto, "adjust"]
  ]);
  names = new Map<ThemeMode, string>([
    [ThemeMode.Light, "Light"],
    [ThemeMode.Dark, "Dark"],
    [ThemeMode.Auto, "Adaptive"]
  ]);

  name: string = "";

  icon: string = "light_mode";

  toggleDarkMode(){
    this.service.toggleDarkMode();
    this.initTheme(this.prefersDark.matches);
  }

  initTheme(prefersDark: boolean = false){
    var mode = this.service.getThemeMode();
    var scheme = mode == ThemeMode.Auto ? prefersDark ? ThemeMode.Dark : ThemeMode.Light
       : mode;

    document.body.classList.remove("dark");

    if(scheme == ThemeMode.Dark){
      document.body.classList.add(scheme);
    }
    this.icon = this.icons.get(mode)??"";
    this.name = this.names.get(mode)??"";
  }
}
