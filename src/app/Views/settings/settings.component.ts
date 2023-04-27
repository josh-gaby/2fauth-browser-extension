import {Component, ElementRef, Renderer2, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faSun, faMoon, faDesktop, faArrowLeftLong} from "@fortawesome/free-solid-svg-icons";
import {SettingsService} from "../../Services/settings/settings.service";
import {ThemingService} from "../../Services/theming/theming.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {
  public host_url:string;
  public host_pat:string;
  public themes;
  public current_theme:string;
  protected readonly faArrowLeftLong = faArrowLeftLong;

  constructor(private router: Router,
              public settings: SettingsService,
              private elRef: ElementRef,
              private renderer: Renderer2,
              private theme: ThemingService) {
    this.host_url = this.settings.get("host_url");
    this.host_pat = this.settings.get("host_pat");
    this.current_theme = this.settings.get('theme');
    this.themes = [
      { text: 'Light', value: 'light', icon: faSun },
      { text: 'Dark', value: 'dark', icon: faMoon },
      { text: 'Auto', value: 'system', icon: faDesktop },
    ]
  }

  setTheme(theme: string): void {
    this.current_theme = theme;
    this.settings.set('theme', theme);
    this.settings.save();
    this.theme.setTheme(theme);
  }

  saveSettings(): void {
    this.settings.set('host_url', this.host_url);
    this.settings.set('host_pat', this.host_pat);
    this.settings.save();
    this.router.navigate(['/accounts']);
  }
}
