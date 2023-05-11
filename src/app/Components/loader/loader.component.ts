import {Component, ViewEncapsulation} from '@angular/core';
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoaderComponent {
  protected readonly faSpinner = faSpinner;
}
