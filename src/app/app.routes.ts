import { Routes } from '@angular/router';
import {PageConnexion} from './page-connexion/page-connexion';
import {PageAccueil} from './page-accueil/page-accueil';
import {PageContact} from './page-contact/page-contact';
import {CitoyenDashboard} from './citoyen-dashboard/citoyen-dashboard';
import {CitoyenGuard} from '../auth.guard';

export const routes: Routes = [
  {path:'login', component: PageConnexion},
  {path:'', component: PageAccueil},
  {path:'contact', component: PageContact},
  {path: 'dashboard',component: CitoyenDashboard,canActivate: [CitoyenGuard],title: 'Dashboard Citoyen'}
];
