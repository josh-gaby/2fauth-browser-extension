import {Component, ElementRef, ViewEncapsulation} from '@angular/core';
import {ApiService} from "../../Services/api/api.service";
import {Otp} from "../../Models/otp";
import {Account} from "../../Models/account";
import {range} from "rxjs";
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {SettingsService} from "../../Services/settings/settings.service";
import {Clipboard} from "@angular/cdk/clipboard";
import {NotificationService} from "../../Services/notification/notification.service";

@Component({
  selector: 'app-otpdisplayer',
  templateUrl: './otpdisplayer.component.html',
  styleUrls: ['./otpdisplayer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OtpDisplayerComponent {
  protected otp: Otp | null = null;
  protected formatted_password: string = '';
  protected account: Account | null = null;
  protected counter: number | null = null;
  protected otp_type: string = '';
  protected readonly range = range;
  protected readonly faSpinner = faSpinner;
  private _lastActiveDot: any = null;
  private _remainingTimeout: any = null;
  private _firstDotToNextOneTimeout: any = null;
  private _dotToDotInterval: any = null;

  constructor(public preferences: PreferencesService,
              protected notifications: NotificationService,
              private _api: ApiService,
              private _element: ElementRef,
              private _settings: SettingsService,
              private _clipboard: Clipboard
  ) {
    // Get the account passed in from the /accounts view
    this.account = history.state.data as Account;
  }

  ngOnInit(): void {
    this._element.nativeElement.querySelector('.tfa-dots').classList.add('loading');
    this.show(this.account?.id);
  }

  /**
   * Format an OTP according to the users preferences
   * This can be in groups of twos, threes or in split in half
   *
   * @param password
   */
  private formatPassword(password: string): string {
    if (this.preferences.get("formatPassword") && password.length > 0) {
      let format_password_by = this.preferences.get("formatPasswordBy");
      const x = Math.ceil(format_password_by < 1 ? password.length * format_password_by : format_password_by),
        chunks = password.match(new RegExp(`.{1,${x}}`, 'g'));
      if (chunks) {
        password = chunks.join(' ');
      }
    }

    return this.preferences.get("showOtpAsDot") ? password.replace(/[0-9]/g, '●') : password;
  }

  /**
   * Copy the OTP to the users' clipboard.
   *
   * @param permit_closing
   */
  public copyOTP(permit_closing: boolean = false) {
    if (this.otp !== null) {
      const success = this._clipboard.copy(this.otp.password);
      if (success == true) {
        if (this.preferences.get('closeOtpOnCopy') && permit_closing === true) {
          window.close();
        } else {
          this.notifications.success("Copied to clipboard", 3000);
        }
      }
    }
  }

  /**
   * Get an OTP from the server
   */
  private getOTP(): Promise<void> {
    return new Promise<void>(resolve => {
      this._api.getOtp(this.account?.id).subscribe(otp => {
        this.otp = otp;
        this.otp_type = otp.otp_type;
        if (this.preferences.get('copyOtpOnDisplay')) {
          this.copyOTP();
        }
        resolve();
      });
    });
  }

  /**
   * Load and display an OTP, includes the starting of the timers
   *
   * @param id
   */
  private show(id: number | boolean = false): void {
    if( id ) {
      this._api.getOtp(this.account?.id).subscribe(otp => {
        this.otp = otp;
        try {
          if (this.preferences.get('copyOtpOnDisplay')) {
            this.copyOTP();
          }
          if(this.isTimeBased(otp.otp_type)) {
            this.startTotpLoop();
          } else if(this.isHMacBased(this.otp.otp_type) && this.otp.counter) {
            this.counter = this.otp.counter;
            this._element.nativeElement.querySelector('.tfa-dots').classList.remove('loading');
            this.formatted_password = this.formatPassword(this.otp.password);
          } else {
            this.notifications.error("Unsupported OTP type.");
          }
          this.otp_type = otp.otp_type;
        } catch(error) {
          this.clearOTP();
        }
      });
    }
  }

  /**
   * Clear all OTP data from the component
   */
  private clearOTP() {
    this.stopLoop()
    this.otp, this.account, this._lastActiveDot, this._remainingTimeout, this._firstDotToNextOneTimeout, this._dotToDotInterval = null;
    this.formatted_password, this.otp_type = '';
    try {
      this._element.nativeElement.querySelector('[data-is-active]').removeAttribute('data-is-active');
      this._element.nativeElement.querySelector('.tfa-dots li:first-child').setAttribute('data-is-active', true);
    } catch(e) {
      // Don't throw anything
    }
  }

  /**
   * Creates a loop to continuously retrieve a new OTP every tim the valid period ends.
   * Handle animating the dots.
   */
  private async startTotpLoop(): Promise<void> {
    if (this.otp === null) {
      await this.getOTP();
    }

    if (this.otp !== null) {
      this._element.nativeElement.querySelector('.tfa-dots').classList.remove('loading')
      this.formatted_password = this.formatPassword(this.otp.password);
      let generated_at = this.otp.generated_at || 0,
          period = this.otp.period || 30,
          elapsedTimeInCurrentPeriod: number,
          remainingTimeBeforeEndOfPeriod: number,
          durationBetweenTwoDots: number,
          durationFromFirstToNextDot: number,
          dots;

      // The elapsed time from the start of the period that contains the OTP generated_at timestamp and the OTP generated_at timestamp itself
      elapsedTimeInCurrentPeriod = generated_at % period;

      // Switch off all dots
      dots = this._element.nativeElement.querySelector('.tfa-dots')
      while (dots.querySelector('[data-is-active]')) {
        dots.querySelector('[data-is-active]').removeAttribute('data-is-active');
      }

      // We determine the position of the closest dot next to the generated_at timestamp
      let relativePosition = (elapsedTimeInCurrentPeriod * 10) / period,
        dotIndex = (Math.floor(relativePosition) + 1);

      // We switch the dot on
      this._lastActiveDot = dots.querySelector('li:nth-child(' + dotIndex + ')');
      this._lastActiveDot.setAttribute('data-is-active', true);

      // Main timeout that run until the end of the period
      remainingTimeBeforeEndOfPeriod = period - elapsedTimeInCurrentPeriod;
      let self = this; // because of the setInterval/setTimeout closures

      this._remainingTimeout = setTimeout(function () {
        self.stopLoop();
        self.otp = null;
        self.startTotpLoop();
      }, remainingTimeBeforeEndOfPeriod * 1000);

      // During the _remainingTimeout countdown we have to show a next dot every durationBetweenTwoDots seconds
      // except for the first next dot
      durationBetweenTwoDots = period / 10; // we have 10 dots
      durationFromFirstToNextDot = (Math.ceil(elapsedTimeInCurrentPeriod / durationBetweenTwoDots) * durationBetweenTwoDots) - elapsedTimeInCurrentPeriod;

      this._firstDotToNextOneTimeout = setTimeout(function () {
        if (durationFromFirstToNextDot > 0) {
          self.activateNextDot();
          dotIndex += 1;
        }
        self._dotToDotInterval = setInterval(function () {
          self.activateNextDot();
          dotIndex += 1;
        }, durationBetweenTwoDots * 1000);
      }, durationFromFirstToNextDot * 1000);
    }
  }

  /**
   * Is the current OTP time based?
   *
   * @param otp_type
   */
  public isTimeBased(otp_type: string): boolean {
    return (otp_type === 'totp' || otp_type === 'steamtotp');
  }

  /**
   * Is the current OTP HMAC based?
   *
   * @param otp_type
   */
  public isHMacBased(otp_type: string): boolean {
    return otp_type === 'hotp';
  }

  /**
   * Stop the loop
   */
  private stopLoop() {
    if (this.isTimeBased(this.otp?.otp_type || '')) {
      clearTimeout(this._remainingTimeout);
      clearTimeout(this._firstDotToNextOneTimeout);
      clearInterval(this._dotToDotInterval);
    }
  }

  /**
   * Add the appropriate attributes to the next dot to activate its color
   */
  private activateNextDot() {
    if (this._lastActiveDot.nextSibling !== null) {
      try {
        this._lastActiveDot.removeAttribute('data-is-active');
        this._lastActiveDot.nextSibling.setAttribute('data-is-active', true);
        this._lastActiveDot = this._lastActiveDot.nextSibling;
      } catch (e) {
        // Do nothing
      }
    }
  }

  /**
   * Clean up before leaving
   */
  ngOnDestroy(): void {
    this.clearOTP();
    try {
      this._lastActiveDot.removeAttribute('data-is-active');
    } catch (e) {
      // Do nothing
    }
  }
}
