import {Component, ElementRef, Renderer2, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";
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

  constructor(private router: Router,
              public settings: SettingsService,
              private elRef: ElementRef,
              private renderer: Renderer2,
              private theme: ThemingService) {
    this.host_url = this.settings.get("host_url");
    this.host_pat = this.settings.get("host_pat");
    let current_theme = this.settings.get('theme');
    this.themes = [
      { text: 'Light', value: 'light', icon: 'sun', selected: current_theme === 'light' },
      { text: 'Dark', value: 'dark', icon: 'moon', selected: current_theme === 'dark' },
      { text: 'Auto', value: 'system', icon: 'desktop', selected: current_theme === 'system' },
    ]
  }

  setTheme(theme: string): void {

    this.settings.set('theme', theme);
    this.theme.setTheme(theme);
  }

  saveSettings(): void {
    this.settings.set('host_url', this.host_url);
    this.settings.set('host_pat', this.host_pat);
    this.settings.save();
    this.router.navigate(['/accounts']);
  }

  protected readonly faGear = faGear;
}
