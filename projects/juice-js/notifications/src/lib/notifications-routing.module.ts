import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactPointsComponent } from './pages/contact-points/contact-points.component';
import { PreferencesComponent } from './pages/preferences/preferences.component';
import { TemplatesComponent } from './pages/templates/templates.component';

/**
 * The settings pages, for `loadChildren`: `preferences` and `contact-points` (the person's), `templates` (the tenant's admins). Guard the
 * route with the app's `AuthGuard`.
 */
const routes: Routes = [
  { path: 'preferences', component: PreferencesComponent, title: 'Notification preferences',
    data: { menuDisplay: true, menuIcon: 'tune', menuTitle: 'Notification preferences', menuOrder: 10 } },
  { path: 'contact-points', component: ContactPointsComponent, title: 'Email addresses',
    data: { menuDisplay: true, menuIcon: 'alternate_email', menuTitle: 'Email addresses', menuOrder: 11 } },
  // For the tenant's admins (the API refuses others): the tenant's own templates, with a preview.
  { path: 'templates', component: TemplatesComponent, title: 'Notification templates',
    data: { menuDisplay: false, menuIcon: 'edit_note', menuTitle: 'Notification templates', menuOrder: 20 } },
  { path: '', redirectTo: 'preferences', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule {
}
