import {ApplicationRef, Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {SettingsService} from "../settings/settings.service";

@Injectable({
  providedIn: 'root'
})
export class ThemingService {
  constructor(private ref: ApplicationRef, private settings: SettingsService) {}

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

  applyPrevious(): void {
    this.setTheme(this.getLastAppliedTheme());
  }

  getLastAppliedTheme(): string {
    return localStorage.getItem('last-theme') || 'system';
  }

  setTheme(theme:string) {
    localStorage.setItem('last-theme', theme);
    if (theme === 'system') {
      this.setSystemTheme();
    } else {
      document.body.setAttribute('data-theme', theme);
    }
  }
}
