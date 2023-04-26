import { Component } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = '2FAuth';
  constructor(private router: Router) {}

  ngOnInit(): void {
    if ((localStorage.getItem('host_url') || '') === '' || (localStorage.getItem('pat') || '') === '') {
      this.router.navigate(['/settings']);
    }
  }
}
