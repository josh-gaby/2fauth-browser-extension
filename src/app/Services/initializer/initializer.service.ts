import { Injectable } from '@angular/core';
import {SettingsService} from "../settings/settings.service";
import {ThemingService} from "../theming/theming.service";

@Injectable({
  providedIn: 'root'
})
export class InitializerService {
  constructor(private settings: SettingsService, private theme: ThemingService) { }

  load(): Promise<any> {
    // Reapply the theme that was last applied on this system
    this.theme.applyPrevious();
    // Load the settings
    return new Promise((resolve, reject) => {
      this.settings.load().then(() => {
        // Apply the theme currently stored in the settings since this could have been updated on a different system
        this.theme.setTheme(this.settings.get('theme'))
        resolve(true);
      }, () => {
        reject(false);
      })
    });
  }
}
