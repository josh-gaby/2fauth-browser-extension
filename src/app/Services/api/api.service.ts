import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Account} from "../../Models/account";
import {Otp} from "../../Models/otp";
import {IPref, Preferences} from "../../Models/preferences";
import {forkJoin, from, map, Observable, of, switchMap} from "rxjs";
import {SettingsService} from "../settings/settings.service";

interface OauthTokenPostResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

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
    return this.http.get<Account[]>(this.getApiUrl() + 'twofaccounts').pipe(
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
    return this.http.get<Otp>(`${this.getApiUrl()}twofaccounts/${account_id}/otp`);
  }

  groups() {
    // TODO
  }

  icons() {
    // TODO
  }

  public refreshToken() {
    return new Promise<boolean>(resolve => {
        const url = `${this.getOauthUrl()}token`,
            data = {
                grant_type: 'refresh_token',
                scope: '*',
                client_id: this.settings.get('client_id'),
                client_secret: this.settings.get('client_secret'),
                refresh_token: this.settings.get('refresh_token')
            }
        this.http.post<HttpResponse<any>>(url, JSON.stringify(data), {observe: 'response'}).subscribe({
          next: response => {
            if (response.status >= 200 && response.status < 400) {
              const data = response.body as unknown as OauthTokenPostResponse;
              this.settings.set('access_token', data.access_token);
              this.settings.set('refresh_token', data.refresh_token);
              this.settings.set('expiry_time', Date.now() + ((data.expires_in - 300) * 1000));
              resolve(true);
            } else {
              this.resetOauthValues();
              resolve(false);
            }
          },
          error: (e: HttpErrorResponse) => {
            this.resetOauthValues();
            resolve(false);
          }
        });
    });
  }



  public requestAccessToken(password: string = '') {
    return new Promise<boolean>(resolve => {
      const url = `${this.getOauthUrl()}token`,
            data = {
              grant_type: 'password',
              scope: '*',
              client_id: this.settings.get('client_id'),
              client_secret: this.settings.get('client_secret'),
              username: this.settings.get('username'),
              password: password
            }
      let data_to_send = JSON.stringify(data);
      this.http.post<HttpResponse<any>>(url, data_to_send, {observe: 'response'}).subscribe({
        next: response => {
          if (response.status >= 200 && response.status < 400 && response.body !== null) {
            const data = response.body as unknown as OauthTokenPostResponse;
            this.settings.set('access_token', data.access_token);
            this.settings.set('refresh_token', data.refresh_token);
            this.settings.set('expiry_time', Date.now() + ((data.expires_in - 300) * 1000));
            resolve(true);
          } else {
            this.resetOauthValues();
            resolve(false);
          }
        },
        error: (e: HttpErrorResponse) => {
          this.resetOauthValues();
          resolve(false);
        }
      });
    });
  }

  private resetOauthValues() {
    this.settings.set('access_token', null);
    this.settings.set('refresh_token', null);
    this.settings.set('expiry_time', null);
  }

  /**
   * Check if the api is accessible using the current settings
   */
  public checkAccess(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this._invalid_token) {
        resolve(false);
      }
      let url = `${this.getApiUrl()}user/preferences`;
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
    let url = `${this.getApiUrl()}user/preferences`;
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

  private getApiUrl(): string {
    return this.settings.get('host_url') + '/api/v1/';
  }

  private getOauthUrl(): string {
    return this.settings.get('host_url') + '/oauth/';
  }
}
