import { Routes } from '@angular/router';
import {PageConnexion} from './page-connexion/page-connexion';
import {PageAccueil} from './page-accueil/page-accueil';
import {CitoyenDashboard} from './citoyen-dashboard/citoyen-dashboard';
import {AdminGuard, CitoyenGuard} from '../auth.guard';
import {PageInscriptionCitoyen} from './page-inscription-citoyen/page-inscription-citoyen';
import {PagePlan} from './page-plan/page-plan';
import {MentionsLegales} from './mentions-legales/mentions-legales';
import {PageConnexionAdmin} from './page-connexion-admin/page-connexion-admin';
import {AdminDashboard} from './admin-dashboard/admin-dashboard';
import {PageConnexionChercheur} from './page-connexion-chercheur/page-connexion-chercheur';
import {ErrorPage} from './error-page/error-page';
import {Capteur} from './capteur/capteur';
import {PageCommentaires} from './page-commentaires/page-commentaires';

export const routes: Routes = [
  {path:'login', component: PageConnexion},
  {path:'', component: PageAccueil},
  {path: 'dashboard',component: CitoyenDashboard,canActivate: [CitoyenGuard]},
  {path: 'dashboard/commentaires', component: PageCommentaires, canActivate: [CitoyenGuard]},
  {path: 'inscription', component: PageInscriptionCitoyen},
  {path: 'plan', component: PagePlan},
  {path: 'mentions-legales', component: MentionsLegales},

  {path: 'login/administrateur', component: PageConnexionAdmin},
  {path: 'dashboard/administrateur', component: AdminDashboard},
  {path: 'dashboard/administrateur/capteur',component: Capteur},

  {path: 'login/chercheur', component : PageConnexionChercheur},

  {path: '**', component : ErrorPage}, // à mettre toujours à la fin
];
