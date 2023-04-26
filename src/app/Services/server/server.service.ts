import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Account} from "../../account";
import {Otp} from "../../otp";
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ServerService {
  constructor(private http: HttpClient) { }

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

  preferences() {

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
