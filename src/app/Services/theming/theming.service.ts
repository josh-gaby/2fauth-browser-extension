import {ApplicationRef, Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {SettingsService} from "../settings/settings.service";

@Injectable({
  providedIn: 'root'
})
export class ThemingService {
  constructor(private ref: ApplicationRef, private settings: SettingsService) {

  }

  setSystemTheme(): void {
    // Initially check if dark mode is enabled on system
    const darkModeOn = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    // If dark mode is enabled then switch to the dark-theme
    if(darkModeOn){
      this.setTheme("dark");
    }

    // Watch for changes of the preference
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', e => {
      if (this.settings.get('theme') === 'system') {
        const turnOn = e.matches;
        this.setTheme(turnOn ? "dark" : "light");
      }
    });
  }

  setTheme(theme:string) {
    if (theme === 'system') {
      this.setSystemTheme();
    } else {
      document.body.setAttribute('data-theme', theme);
    }
  }
}
