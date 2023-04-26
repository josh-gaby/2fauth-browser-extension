import {Component, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {
  public host_url = localStorage.getItem('host_url') || '';
  public pat = localStorage.getItem('pat') || '';

  constructor(private router: Router) {}

  saveSettings(): void {
    localStorage.setItem('host_url', this.host_url);
    localStorage.setItem('pat', this.pat);
    this.router.navigate(['/accounts']);
  }
}
