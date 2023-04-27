import {Component, ViewEncapsulation} from '@angular/core';
import {ServerService} from "../../Services/server/server.service";
import {Account} from "../../Models/account";
import {AppRoutingModule} from "../../app-routing.module";
import {Router} from "@angular/router";
import {faGear} from "@fortawesome/free-solid-svg-icons/faGear";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AccountsComponent {
  faGear = faGear;
  accounts: Account[] = [];
  public icon_url: string = '';

  constructor(private serverService: ServerService, private router: Router) {}

  ngOnInit(): void {
    this.icon_url = (localStorage.getItem('host_url') || '') + '/storage/icons/';
    this.getAccounts();
  }

  getAccounts(): void {
    this.serverService.twofaccounts().subscribe(accounts => this.accounts = accounts);
  }
}
