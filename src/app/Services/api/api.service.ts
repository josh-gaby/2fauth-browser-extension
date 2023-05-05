import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Account} from "../../Models/account";
import {Otp} from "../../Models/otp";
import {IPref, Preferences} from "../../Models/preferences";
import {forkJoin, from, map, Observable, of, switchMap} from "rxjs";
import {SettingsService} from "../settings/settings.service";

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  _invalid_token: boolean = false;
  constructor(private http: HttpClient, private settings: SettingsService) {}

  get invalid_token(): boolean {
    return this._invalid_token;
  }

  set invalid_token(value: boolean) {
    this._invalid_token = value;
  }

  public getAccounts(): Observable<Account[]> {
    if (this._invalid_token) {
      return of([]);
    }
    return this.http.get<Account[]>(this.getUrl() + 'twofaccounts').pipe(
      switchMap(accounts => {
        let blobStateObservables = accounts.map(account => {
          if (account.icon !== null) {
            return from(fetch(this.settings.get('host_url') + '/storage/icons/' + account.icon, {mode: 'no-cors'}).then((response: Response) => {
              return response.blob();
            })).pipe(
              map((blob: Blob) => {
                if (blob.type !== '') {
                  // Store the blob as a base64 encoded image if possible
                  account.icon_src = blob;
                } else {
                  // Otherwise, store the icons url
                  account.icon_src = this.settings.get('host_url') + '/storage/icons/' + account.icon;
                }
                return account;
              })
            );
          } else {
            account.icon_src = null;
            return of(account);
          }
        });
        return forkJoin(blobStateObservables);
      }),
      switchMap(accounts => {
        let imageStateObservables = accounts.map(account => {
          if (account.icon_src !== null && typeof account.icon_src !== 'string') {
            return this.blobToBase64(account.icon_src).pipe(
              map((base64: string) => {
                account.icon_src = base64;
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

  public getOtp(account_id: any): Observable<Otp> {
    if (this._invalid_token) {
      return of({} as Otp);
    }
    return this.http.get<Otp>(`${this.getUrl()}twofaccounts/${account_id}/otp`);
  }

  groups() {
    // TODO
  }

  icons() {
    // TODO
  }

  /**
   * Check if the api is accessible using the current settings
   */
  public checkAccess(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this._invalid_token) {
        resolve(false);
      }
      let url = `${this.getUrl()}user/preferences`;
      this.http.get<HttpResponse<any>>(url, {observe: 'response'}).subscribe({
        next: response => {
          if (response.status >= 200 && response.status < 400) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: (e: HttpErrorResponse) => {
          resolve(false);
        }
      });
    })
  }

  public getPreferences(): Observable<Preferences> {
    if (this._invalid_token) {
      return of({} as Preferences);
    }
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

  private getUrl(): string {
    return this.settings.get('host_url') + '/api/v1/';
  }
}
