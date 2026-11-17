import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactPointsComponent } from './pages/contact-points/contact-points.component';
import { PreferencesComponent } from './pages/preferences/preferences.component';

/** The person's settings pages, for `loadChildren`: `preferences` and `contact-points`. Guard the route with the app's `AuthGuard`. */
const routes: Routes = [
  { path: 'preferences', component: PreferencesComponent, title: 'Notification preferences',
    data: { menuDisplay: true, menuIcon: 'tune', menuTitle: 'Notification preferences', menuOrder: 10 } },
  { path: 'contact-points', component: ContactPointsComponent, title: 'Email addresses',
    data: { menuDisplay: true, menuIcon: 'alternate_email', menuTitle: 'Email addresses', menuOrder: 11 } },
  { path: '', redirectTo: 'preferences', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule {
}
