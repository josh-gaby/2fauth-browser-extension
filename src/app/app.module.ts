import {APP_INITIALIZER, NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {SettingsComponent} from './Views/settings/settings.component';
import {AccountsComponent} from './Views/accounts/accounts.component';
import {OtpDisplayerComponent} from './Views/otpdisplayer/otpdisplayer.component';
import {TokenInterceptorService} from "./Interceptors/token-interceptor.service";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NotificationComponent} from './Components/notification/notification.component';
import {NotificationService} from './Services/notification/notification.service';
import {SettingsService} from "./Services/settings/settings.service";
import {PreferencesService} from "./Services/preferences/preferences.service";
import {ThemingService} from "./Services/theming/theming.service";
import {InitializerService} from "./Services/initializer/initializer.service";
import {AccountCacheService} from "./Services/accountcache/accountcache.service";
import {StorageService} from "./Services/storage/storage.service";
import {ApiService} from "./Services/api/api.service";
import {ServiceWorkerService} from "./Services/serviceworker/serviceworker.service";
import {AuthComponent} from './Views/auth/auth.component';

/**
 * Make sure that we have loaded all settings from storage before the app loads
 *
 * @param service
 */
function initializeApp(service: InitializerService): Function {
  return () => service.load();
}

@NgModule({
  declarations: [AppComponent, SettingsComponent, AccountsComponent, OtpDisplayerComponent, NotificationComponent, AuthComponent],
  imports: [AppRoutingModule, BrowserModule, HttpClientModule, FormsModule, FontAwesomeModule ],
  providers: [
    {provide: APP_INITIALIZER, useFactory: initializeApp, deps: [InitializerService], multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true,},
    AccountCacheService,
    ApiService,
    InitializerService,
    NotificationService,
    PreferencesService,
    ServiceWorkerService,
    SettingsService,
    StorageService,
    ThemingService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {}
