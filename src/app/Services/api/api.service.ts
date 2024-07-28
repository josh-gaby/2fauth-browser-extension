import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
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

  /**
   * Get a list of Accounts from the 2FAuth server
   */
  public getAccounts(): Observable<Account[]> {
    // Invalid token flag is set, return a blank list
    if (this._invalid_token) {
      return of([]);
    }
    // Request the accounts from the server
    return this.http.get<Account[]>(this.getAPIUrl('twofaccounts')).pipe(
      switchMap(accounts => {
        let blobStateObservables = accounts.map(account => {
          if (account.icon !== null) {
            return from(fetch(this.getHostUrl(`storage/icons/${account.icon}`), {mode: 'no-cors'}).then((response: Response) => {
              return response.blob();
            })).pipe(
              map((blob: Blob) => {
                if (blob.type !== '') {
                  // Store the blob as a base64 encoded image if possible
                  account.icon_src = blob;
                } else {
                  // Otherwise, store the icons url
                  account.icon_src = this.getHostUrl(`storage/icons/${account.icon}`);
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

  /**
   * Convert a Blob to a base64 string
   *
   * @param blob
   * @private
   */
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

  /**
   * Get the current OTP from the server
   *
   * @param account_id
   */
  public getOtp(account_id: any): Observable<Otp> {
    if (this._invalid_token) {
      return of({} as Otp);
    }
    return this.http.get<Otp>(this.getAPIUrl(`twofaccounts/${account_id}/otp`));
  }

  /**
   * Check if the api is accessible using the current settings
   */
  public checkAccess(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this._invalid_token) {
        resolve(false);
      }
      let url = this.getAPIUrl('user/preferences');
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

  /**
   * Retrieve the users preferences from the 2FAuth server
   */
  public getPreferences(): Observable<Preferences> {
    if (this._invalid_token) {
      return of({} as Preferences);
    }
    let url = this.getAPIUrl('user/preferences');
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

  /**
   * Get a URL for the 2FAuth server.
   *
   * @param relative_url
   * @private
   */
  private getHostUrl(relative_url?: string): string {
    return `${this.settings.get('host_url')}/${typeof relative_url !== 'undefined' ? relative_url : ''}`;
  }

  /**
   * Get an API URL for the 2FAuth server.
   *
   * @param relative_url
   * @private
   */
  private getAPIUrl(relative_url?: string): string {
    return this.getHostUrl(`api/v1/${typeof relative_url !== 'undefined' ? relative_url : ''}`);
  }
}
