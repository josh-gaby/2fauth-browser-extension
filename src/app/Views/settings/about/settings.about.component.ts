import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";
import packageInfo from '../../../../../package.json';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.about.component.html',
  styleUrls: ['../settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsAboutComponent {
  protected readonly faChevronLeft = faChevronLeft;
  public current_year: number = 2023;
  public app_version: string = packageInfo.version;
  public server_version: string = '';

  constructor(private router: Router) {
    this.current_year = new Date().getFullYear();
  }
}
