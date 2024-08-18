import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faChevronLeft, faDesktop, faMoon, faSun} from "@fortawesome/free-solid-svg-icons";
import {SettingsService} from "../../../Services/settings/settings.service";
import {ThemingService} from "../../../Services/theming/theming.service";
import {LoaderService} from "../../../Services/loader/loader.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.appearance.component.html',
  styleUrls: ['../settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsAppearanceComponent {
  protected themes = [
    { text: 'Light', value: 'light', icon: faSun },
    { text: 'Dark', value: 'dark', icon: faMoon },
    { text: 'Auto', value: 'system', icon: faDesktop },
  ];
  protected current_theme: string;
  protected readonly faChevronLeft = faChevronLeft;

  constructor(private loader: LoaderService,
              private router: Router,
              private theme: ThemingService,
              public settings: SettingsService,
  ) {
    this.current_theme = this.settings.get('theme', "system");
  }

  /**
   * Apply a theme
   *
   * @param theme
   */
  public setTheme(theme: string): void {
    this.current_theme = theme;
    this.settings.set('theme', theme);
    this.settings.save();
    this.theme.setTheme(theme);
  }
}
