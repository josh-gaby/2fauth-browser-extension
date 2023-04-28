import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Account} from "../../Models/account";
import {Otp} from "../../Models/otp";
import {IPref} from "../../Models/ipref";
import {Preferences} from "../../Models/preferences";
import {map, Observable} from "rxjs";
import {SettingsService} from "../settings/settings.service";

@Injectable({
  providedIn: 'root'
})

export class ServerService {
  constructor(private http: HttpClient, private settings: SettingsService) {
  }

  twofaccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.getUrl() + 'twofaccounts');
  }

  otp(account_id: any): Observable<Otp> {
    return this.http.get<Otp>(`${this.getUrl()}twofaccounts/${account_id}/otp`);
  }

  groups() {

  }

  icons() {

  }

  preferences(): Observable<Preferences> {
    let url = `${this.getUrl()}user/preferences`;
    console.log('get preferences from server', url);
    return this.http.get<IPref[]>(url).pipe(map((preferences: IPref[]) => {
      let _map = <any>{};
      preferences.forEach((pref: IPref) => {
        _map[`${pref.key}`] = pref.value;
      });
      console.log(_map);
      return _map as Preferences;
    }))
  }

  getUrl(): string {
    return this.settings.get('host_url') + '/api/v1/';
  }
}
