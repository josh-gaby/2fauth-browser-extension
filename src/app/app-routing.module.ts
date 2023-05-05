import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SettingsComponent} from "./Views/settings/settings.component";
import {AccountsComponent} from "./Views/accounts/accounts.component";
import {OtpDisplayerComponent} from "./Views/otpdisplayer/otpdisplayer.component";
import {AuthComponent} from "./Views/auth/auth.component";
import {LoadingComponent} from "./Views/loading/loading.component";

const routes: Routes = [
  { path: 'accounts', component: AccountsComponent },
  { path: 'accounts/:id', component: OtpDisplayerComponent },
  { path: 'loading', component: LoadingComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'auth', component: AuthComponent },
  { path: '', redirectTo: '/loading', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
