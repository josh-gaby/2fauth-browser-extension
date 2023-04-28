import {Component, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import {ServerService} from "../../Services/server/server.service";
import {Otp} from "../../Models/otp";
import {Account} from "../../Models/account";
import {Router} from "@angular/router";
import {range} from "rxjs";
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";
import {Preferences} from "../../Models/preferences";
import {PreferencesService} from "../../Services/preferences/preferences.service";
import {SettingsService} from "../../Services/settings/settings.service";
import {Clipboard} from "@angular/cdk/clipboard";
import {NotificationService} from "../../Services/notification/notification.service";

@Component({
  selector: 'app-otpdisplayer', templateUrl: './otpdisplayer.component.html', styleUrls: ['./otpdisplayer.component.scss'], encapsulation: ViewEncapsulation.None
})
export class OtpDisplayerComponent {
  public otp: Otp | null = null;
  public formatted_password: string = '';
  public account: Account | null = null;
  private lastActiveDot: any = null;
  private remainingTimeout: any = null;
  private firstDotToNextOneTimeout: any = null;
  private dotToDotInterval: any = null;
  public counter: number | null = null;
  public icon_url: string = '';
  protected otp_type: string = '';
  protected readonly range = range;
  protected readonly faSpinner = faSpinner;

  constructor(private serverService: ServerService,
              private router: Router,
              private element: ElementRef,
              public preferences: PreferencesService,
              private settings: SettingsService,
              private clipboard: Clipboard,
              protected notifications: NotificationService
  ) {
    this.account = history.state.data;
    this.icon_url = this.settings.get('host_url') + '/storage/icons/';
  }

  ngOnInit(): void {
    this.element.nativeElement.querySelector('.tfa-dots').classList.add('loading');
    this.show(this.account?.id);
  }

  formatPassword(pwd: string): string {
    if (this.preferences.get("formatPassword") && pwd.length > 0) {
      let format_password_by = this.preferences.get("formatPasswordBy");
      const x = Math.ceil(format_password_by < 1 ? pwd.length * format_password_by : format_password_by),
        chunks = pwd.match(new RegExp(`.{1,${x}}`, 'g'));
      if (chunks) {
        pwd = chunks.join(' ');
      }
    }

    return this.preferences.get("showOtpAsDot") ? pwd.replace(/[0-9]/g, '●') : pwd;
  }

  copyOTP(permit_closing: boolean = false) {
    if (this.otp !== null) {
      const success = this.clipboard.copy(this.otp.password);
      if (success == true) {
        if (this.preferences.get('closeOtpOnCopy') && permit_closing === true) {
          window.close();
        } else {
          this.notifications.success("Copied to clipboard", 3000);
        }
      }
    }
  }

  getOTP(): Promise<void> {
    return new Promise<void>(resolve => {
      this.serverService.otp(this.account?.id).subscribe(otp => {
        this.otp = otp;
        this.otp_type = otp.otp_type;
        if (this.preferences.get('copyOtpOnDisplay')) {
          this.copyOTP();
        }
        resolve();
      });
    });
  }

  show(id: number | boolean = false): void {
    if( id ) {
      this.serverService.otp(this.account?.id).subscribe(otp => {
        this.otp = otp;
        try {
          if (this.preferences.get('copyOtpOnDisplay')) {
            this.copyOTP();
          }
          if(this.isTimeBased(otp.otp_type)) {
            this.startTotpLoop();
          } else if(this.isHMacBased(this.otp.otp_type) && this.otp.counter) {
            this.counter = this.otp.counter;
            this.element.nativeElement.querySelector('.tfa-dots').classList.remove('loading');
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

  clearOTP() {
    this.stopLoop()
    this.otp, this.account, this.lastActiveDot, this.remainingTimeout, this.firstDotToNextOneTimeout, this.dotToDotInterval = null;
    this.formatted_password, this.icon_url, this.otp_type = '';
    try {
      this.element.nativeElement.querySelector('[data-is-active]').removeAttribute('data-is-active');
      this.element.nativeElement.querySelector('.tfa-dots li:first-child').setAttribute('data-is-active', true);
    } catch(e) {
      // Don't throw anything
    }
  }

  async startTotpLoop(): Promise<void> {
    if (this.otp === null) {
      await this.getOTP();
    }

    if (this.otp !== null) {
      this.element.nativeElement.querySelector('.tfa-dots').classList.remove('loading')
      this.formatted_password = this.formatPassword(this.otp.password);
      let generated_at = this.otp.generated_at || 0,
        period = this.otp.period || 30,
        elapsedTimeInCurrentPeriod: number,
        remainingTimeBeforeEndOfPeriod: number,
        durationBetweenTwoDots: number,
        durationFromFirstToNextDot: number,
        dots;

      //                              |<----period p----->|
      //     |                        |                   |
      //     |------- ··· ------------|--------|----------|---------->
      //     |                        |        |          |
      //  unix T0                 Tp.start   Tgen_at    Tp.end
      //                              |        |          |
      //  elapsedTimeInCurrentPeriod--|<------>|          |
      //  (in ms)                     |        |          |
      //                              ● ● ● ● ●|● ◌ ◌ ◌ ◌ |
      //                              | |      ||         |
      //                              | |      |<-------->|--remainingTimeBeforeEndOfPeriod (for remainingTimeout)
      //     durationBetweenTwoDots-->|-|<     ||
      //     (for dotToDotInterval)   | |     >||<---durationFromFirstToNextDot (for firstDotToNextOneTimeout)
      //                                        |
      //                                        |
      //                                     dotIndex

      // The elapsed time from the start of the period that contains the OTP generated_at timestamp and the OTP generated_at timestamp itself
      elapsedTimeInCurrentPeriod = generated_at % period;

      // Switch off all dots
      dots = this.element.nativeElement.querySelector('.tfa-dots')
      while (dots.querySelector('[data-is-active]')) {
        dots.querySelector('[data-is-active]').removeAttribute('data-is-active');
      }

      // We determine the position of the closest dot next to the generated_at timestamp
      let relativePosition = (elapsedTimeInCurrentPeriod * 10) / period,
        dotIndex = (Math.floor(relativePosition) + 1);

      // We switch the dot on
      this.lastActiveDot = dots.querySelector('li:nth-child(' + dotIndex + ')');
      this.lastActiveDot.setAttribute('data-is-active', true);

      // Main timeout that run until the end of the period
      remainingTimeBeforeEndOfPeriod = period - elapsedTimeInCurrentPeriod;
      let self = this; // because of the setInterval/setTimeout closures

      this.remainingTimeout = setTimeout(function () {
        self.stopLoop();
        self.otp = null;
        self.startTotpLoop();
      }, remainingTimeBeforeEndOfPeriod * 1000);

      // During the remainingTimeout countdown we have to show a next dot every durationBetweenTwoDots seconds
      // except for the first next dot
      durationBetweenTwoDots = period / 10; // we have 10 dots
      durationFromFirstToNextDot = (Math.ceil(elapsedTimeInCurrentPeriod / durationBetweenTwoDots) * durationBetweenTwoDots) - elapsedTimeInCurrentPeriod;

      this.firstDotToNextOneTimeout = setTimeout(function () {
        if (durationFromFirstToNextDot > 0) {
          self.activateNextDot();
          dotIndex += 1;
        }
        self.dotToDotInterval = setInterval(function () {
          self.activateNextDot();
          dotIndex += 1;
        }, durationBetweenTwoDots * 1000);
      }, durationFromFirstToNextDot * 1000);
    }
  }

  isTimeBased(otp_type: string): boolean {
    return (otp_type === 'totp' || otp_type === 'steamtotp');
  }

  isHMacBased(otp_type: string): boolean {
    return otp_type === 'hotp';
  }

  stopLoop() {
    if (this.isTimeBased(this.otp?.otp_type || '')) {
      clearTimeout(this.remainingTimeout);
      clearTimeout(this.firstDotToNextOneTimeout);
      clearInterval(this.dotToDotInterval);
    }
  }

  activateNextDot() {
    if (this.lastActiveDot.nextSibling !== null) {
      this.lastActiveDot.removeAttribute('data-is-active');
      this.lastActiveDot.nextSibling.setAttribute('data-is-active', true);
      this.lastActiveDot = this.lastActiveDot.nextSibling;
    }
  }

  ngOnDestroy(): void {
    this.stopLoop();
    try {
      this.lastActiveDot.removeAttribute('data-is-active');
    } catch (e) {
      // Do nothing
    }
  }
}
