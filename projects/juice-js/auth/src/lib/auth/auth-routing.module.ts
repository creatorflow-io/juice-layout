import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogoutCompletedComponent } from "../pages/logout-completed/logout-completed.component";
import { LoginComponent } from "../pages/login/login.component";
import { LoginCompletedComponent } from "../pages/login-completed/login-completed.component";
import { UserInfoComponent } from "../pages/protected/user-info/user-info.component";
import { LogoutComponent } from "../pages/logout/logout.component";
import { UnauthorizedComponent } from '../pages/unauthorized/unauthorized.component';
import { AuthGuard } from './auth.guard';
import { DevGuard } from '@juice-js/layout';

const routes: Routes = [
  {path: 'login', component: LoginComponent, title: 'Login'},
  {path: 'login-completed', component: LoginCompletedComponent, title: 'Login completed'},
  {path: 'logout', component: LogoutComponent},
  {path: 'logout-completed', component: LogoutCompletedComponent, title: 'Logout completed'},
  {path: 'unauthorized', component: UnauthorizedComponent, title: 'Unauthorized'},
  {path: 'user-info', component: UserInfoComponent, canActivate: [AuthGuard, DevGuard], title: 'User info',
     data:{
      menuDisplay: [DevGuard],
      menuIcon: 'account_circle',
      menuOrder: 100,
     }},
  {path: '', redirectTo: 'user-info', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule{
 
}