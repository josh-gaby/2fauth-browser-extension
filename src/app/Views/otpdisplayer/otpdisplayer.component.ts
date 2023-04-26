import {Component, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import {ServerService} from "../../Services/server/server.service";
import {Otp} from "../../otp";
import {Account} from "../../account";
import {Router} from "@angular/router";
import {range} from "rxjs";

@Component({
  selector: 'app-otpdisplayer',
  templateUrl: './otpdisplayer.component.html',
  styleUrls: ['./otpdisplayer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OtpDisplayerComponent {
  public otp: Otp | null = null;
  public account: Account | null = null;
  private lastActiveDot: any = null;
  private remainingTimeout: any = null;
  private firstDotToNextOneTimeout: any = null;
  private dotToDotInterval: any = null;
  constructor(private serverService: ServerService, private router: Router, private element: ElementRef) { }

  ngOnInit(): void {
    this.account = history.state.data;
    this.element.nativeElement.querySelector('.tfa-dots').classList.add('loading')
    this.startTotpLoop();
  }

  startTotpLoop(): void {
    this.serverService.otp(this.account?.id).subscribe(otp => {
      this.element.nativeElement.querySelector('.tfa-dots').classList.remove('loading')
      this.otp = otp;
      let generated_at = otp.generated_at || 0,
        period = otp.period || 30,
        elapsedTimeInCurrentPeriod: number,
        remainingTimeBeforeEndOfPeriod: number,
        durationBetweenTwoDots: number,
        durationFromFirstToNextDot: number,
        dots

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
      elapsedTimeInCurrentPeriod = generated_at % period

      // Switch off all dots
      dots = this.element.nativeElement.querySelector('.tfa-dots')
      while (dots.querySelector('[data-is-active]')) {
        dots.querySelector('[data-is-active]').removeAttribute('data-is-active');
      }

      // We determine the position of the closest dot next to the generated_at timestamp
      let relativePosition = (elapsedTimeInCurrentPeriod * 10) / period
      let dotIndex = (Math.floor(relativePosition) +1)

      // We switch the dot on
      this.lastActiveDot = dots.querySelector('li:nth-child(' + dotIndex + ')');
      this.lastActiveDot.setAttribute('data-is-active', true);

      // Main timeout that run until the end of the period
      remainingTimeBeforeEndOfPeriod = period - elapsedTimeInCurrentPeriod
      let self = this; // because of the setInterval/setTimeout closures

      this.remainingTimeout = setTimeout(function() {
        self.stopLoop()
        self.startTotpLoop();
      }, remainingTimeBeforeEndOfPeriod*1000);

      // During the remainingTimeout countdown we have to show a next dot every durationBetweenTwoDots seconds
      // except for the first next dot
      durationBetweenTwoDots = period / 10 // we have 10 dots
      durationFromFirstToNextDot = (Math.ceil(elapsedTimeInCurrentPeriod / durationBetweenTwoDots) * durationBetweenTwoDots) - elapsedTimeInCurrentPeriod

      this.firstDotToNextOneTimeout = setTimeout(function() {
        if( durationFromFirstToNextDot > 0 ) {
          self.activateNextDot()
          dotIndex += 1
        }
        self.dotToDotInterval = setInterval(function() {
          self.activateNextDot()
          dotIndex += 1
        }, durationBetweenTwoDots*1000)
      }, durationFromFirstToNextDot*1000)
    });
  }

  isTimeBased(otp_type: string) {
    return (otp_type === 'totp' || otp_type === 'steamtotp')
  }

  stopLoop() {
    if( this.isTimeBased(this.otp?.otp_type || '') ) {
      clearTimeout(this.remainingTimeout)
      clearTimeout(this.firstDotToNextOneTimeout)
      clearInterval(this.dotToDotInterval)
    }
  }

  activateNextDot() {
    if(this.lastActiveDot.nextSibling !== null) {
      this.lastActiveDot.removeAttribute('data-is-active')
      this.lastActiveDot.nextSibling.setAttribute('data-is-active', true)
      this.lastActiveDot = this.lastActiveDot.nextSibling
    }
  }

  ngOnDestroy(): void {
    this.stopLoop();
    this.lastActiveDot.removeAttribute('data-is-active');
  }

  protected readonly range = range;
}
