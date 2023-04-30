import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Account} from "../../Models/account";
import {Otp} from "../../Models/otp";
import {IPref, Preferences} from "../../Models/preferences";
import {forkJoin, map, Observable, of, switchMap} from "rxjs";
import {SettingsService} from "../settings/settings.service";

@Injectable({
  providedIn: 'root'
})

export class ServerService {
  constructor(private http: HttpClient, private settings: SettingsService) {}

  twofaccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.getUrl() + 'twofaccounts').pipe(
      switchMap(accounts => {
        let blobStateObservables = accounts.map(account => {
          if (account.icon !== null) {
            return this.http.get(this.settings.get('host_url') + '/storage/icons/' + account.icon, {responseType: "blob"}).pipe(
              map((blob: Blob) => {
                account.encoded_icon = blob;
                return account;
              })
            );
          } else {
            account.encoded_icon = null;
            return of(account);
          }
        });
        return forkJoin(blobStateObservables);
      }),
      switchMap(accounts => {
        let imageStateObservables = accounts.map(account => {
          if (account.encoded_icon !== null && typeof account.encoded_icon !== 'string') {
            return this.blobToBase64(account.encoded_icon).pipe(
              map((base64: string) => {
                account.encoded_icon = base64;
                return account;
              }));
          } else {
            return of(account);
          }
        });
        return forkJoin(imageStateObservables);
      })
    )
  }

  private blobToBase64(blob: Blob): Observable<string> {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Observable<string>(observer => {
      reader.onloadend = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
    });
  }

  otp(account_id: any): Observable<Otp> {
    return this.http.get<Otp>(`${this.getUrl()}twofaccounts/${account_id}/otp`);
  }

  groups() {
    // TODO
  }

  icons() {
    // TODO
  }

  preferences(): Observable<Preferences> {
    let url = `${this.getUrl()}user/preferences`;
    return this.http.get<IPref[]>(url).pipe(
      map((preferences: IPref[]) => {
        let _map = <any>{};
        preferences.forEach((pref: IPref) => {
          _map[`${pref.key}`] = pref.value;
        });
        return _map as Preferences;
      })
    );
  }

  getUrl(): string {
    return this.settings.get('host_url') + '/api/v1/';
  }
}
