import {APP_INITIALIZER, NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {SettingsComponent} from './Views/settings/settings.component';
import {SettingsAboutComponent} from "./Views/settings/about/settings.about.component";
import {SettingsAccountComponent} from "./Views/settings/account/settings.account.component";
import {SettingsAppearanceComponent} from "./Views/settings/appearance/settings.appearance.component";
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
import {LoaderComponent} from "./Components/loader/loader.component";
import {LoaderService} from "./Services/loader/loader.service";
import {AutoFocusDirective} from "./Directives/auto-focus.directive";
import {NgOptimizedImage} from "@angular/common";
import {SwMessageType} from "./Models/message";


/**
 * Make sure that we have loaded all settings from storage before the app loads
 *
 * @param service
 */
function initializeApp(service: InitializerService): Function {
  return () => service.load();
}

@NgModule({
  declarations: [AppComponent, SettingsComponent, SettingsAboutComponent, SettingsAccountComponent, SettingsAppearanceComponent, AccountsComponent, OtpDisplayerComponent, NotificationComponent, AuthComponent, LoaderComponent],
  imports: [AppRoutingModule, BrowserModule, HttpClientModule, FormsModule, FontAwesomeModule, AutoFocusDirective, NgOptimizedImage],
  providers: [
    {provide: APP_INITIALIZER, useFactory: initializeApp, deps: [InitializerService], multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true,},
    AccountCacheService,
    ApiService,
    InitializerService,
    LoaderService,
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
