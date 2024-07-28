import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from "@angular/router";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {LoaderService} from "../../Services/loader/loader.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {
  protected readonly faChevronLeft = faChevronLeft;
  protected readonly faChevronRight = faChevronRight;

  constructor(private loader: LoaderService, private router: Router) {}
}
