import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Account} from "../../Models/account";
import {Otp} from "../../Models/otp";
import {IPref} from "../../Models/ipref";
import {Preferences} from "../../Models/preferences";
import {map, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})

export class ServerService {
  constructor(private http: HttpClient) {
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
    return this.http.get<IPref[]>(`${this.getUrl()}user/preferences`).pipe(map((preferences: IPref[]) => {
      let _map = <any>{};
      preferences.forEach((pref: IPref) => {
        _map[`${pref.key}`] = pref.value;
      });
      return _map as Preferences;
    }))
  }

  settings() {

  }

  getUrl(): string {
    let url = localStorage.getItem('host_url') || '';
    if (url !== '') {
      url += '/api/v1/'
    }
    return url;
  }
}
