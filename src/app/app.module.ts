import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {SettingsComponent} from './Views/settings/settings.component';
import {AccountsComponent} from './Views/accounts/accounts.component';
import {OtpDisplayerComponent} from './Views/otpdisplayer/otpdisplayer.component';
import {TokenInterceptorService} from "./Interceptors/token-interceptor.service";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { NotificationComponent } from './Components/notification/notification.component';
import { NotificationService } from './Services/notification/notification.service';
import {SettingsService} from "./Services/settings/settings.service";
import {SettingsClass} from "./Models/settings";

@NgModule({
  declarations: [AppComponent, SettingsComponent, AccountsComponent, OtpDisplayerComponent, NotificationComponent],
  imports: [AppRoutingModule, BrowserModule, HttpClientModule, FormsModule, FontAwesomeModule,],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true,},
    { provide: Window, useValue: window },
    NotificationService,
    SettingsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
