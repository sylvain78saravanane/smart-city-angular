import { Routes } from '@angular/router';
import {PageConnexion} from './page-connexion/page-connexion';
import {PageAccueil} from './page-accueil/page-accueil';

export const routes: Routes = [
  {path:'login', component: PageConnexion},
  {path:'', component: PageAccueil},
];
