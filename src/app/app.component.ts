import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {ServerService} from "./Services/server/server.service";
import {Preferences} from "./Models/preferences";

@Component({
  selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';

  constructor(private router: Router, private serverService: ServerService) {
  }

  ngOnInit(): void {
    if ((localStorage.getItem('host_url') || '') === '' || (localStorage.getItem('pat') || '') === '') {
      // Missing host url or PAT, display the settings page so that they can be entered
      this.router.navigate(['/settings']);
    } else {
      // Get the current user preferences
      this.serverService.preferences().subscribe(preferences => {
        localStorage.setItem('preferences', JSON.stringify(preferences));
      });
    }
  }
}
