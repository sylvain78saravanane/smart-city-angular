import { Routes } from '@angular/router';
import {PageConnexion} from './page-connexion/page-connexion';
import {PageAccueil} from './page-accueil/page-accueil';
import {PageContact} from './page-contact/page-contact';
import {CitoyenDashboard} from './citoyen-dashboard/citoyen-dashboard';
import {CitoyenGuard} from '../auth.guard';
import {PageInscriptionCitoyen} from './page-inscription-citoyen/page-inscription-citoyen';

export const routes: Routes = [
  {path:'login', component: PageConnexion},
  {path:'', component: PageAccueil},
  {path:'contact', component: PageContact},
  {path: 'dashboard',component: CitoyenDashboard,canActivate: [CitoyenGuard]},
  {path: 'inscription', component: PageInscriptionCitoyen}
];
