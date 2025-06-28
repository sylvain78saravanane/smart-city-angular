import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './app/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          // Vérifier le rôle si spécifié dans les données de la route
          const requiredRole = route.data?.['role'];
          if (requiredRole && user.role !== requiredRole) {
            // Rediriger vers la page appropriée selon le rôle
            this.redirectBasedOnRole(user.role);
            return false;
          }
          return true;
        }

        // Pas connecté, rediriger vers login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'CITOYEN':
        this.router.navigate(['/dashboard']);
        break;
      case 'ADMINISTRATEUR':
        this.router.navigate(['/dashboard/administrateur']);
        break;
      case 'GESTIONNAIRE_VILLE':
        this.router.navigate(['/dashboard/gestionnaire']);
        break;
      case 'CHERCHEUR':
        this.router.navigate(['/dashboard/chercheur']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // Vérifier si l'utilisateur est connecté et est un admin
        if (user && user.role === 'ADMINISTRATEUR' && this.authService.isAdmin()) {
          return true;
        }

        // Si l'utilisateur est connecté mais pas admin
        if (user) {
          this.redirectBasedOnRole(user.role);
        } else {
          // Pas connecté, rediriger vers la page de connexion admin
          this.router.navigate(['/login/administrateur'], {
            queryParams: { returnUrl: state.url, message: 'Accès administrateur requis' }
          });
        }
        return false;
      })
    );
  }

  private redirectBasedOnRole(role: string): void {
    // Afficher un message d'erreur pour accès non autorisé
    this.router.navigate(['/login'], {
      queryParams: {
        error: 'Accès refusé - Droits administrateur requis',
        returnUrl: '/login/administrateur'
      }
    });
  }
}

// Optionnel : Guard spécifique pour vérifier le code admin
@Injectable({
  providedIn: 'root'
})
export class AdminCodeGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    const isValidAdmin = this.authService.isAdmin();

    if (!user || !isValidAdmin) {
      this.router.navigate(['/admin/login'], {
        queryParams: { error: 'Session administrateur expirée' }
      });
      return false;
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CitoyenGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && user.role === 'CITOYEN') {
          return true;
        }

        if (user) {
          // Utilisateur connecté mais pas citoyen
          this.redirectBasedOnRole(user.role);
        } else {
          // Pas connecté
          this.router.navigate(['/login']);
        }
        return false;
      })
    );
  }

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'ADMINISTRATEUR':
        this.router.navigate(['/dashboard/administrateur']);
        break;
      case 'GESTIONNAIRE_VILLE':
        this.router.navigate(['/dashboard/gestionnaire']);
        break;
      case 'CHERCHEUR':
        this.router.navigate(['/dashboard/chercheur']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}
