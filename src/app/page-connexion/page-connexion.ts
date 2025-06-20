import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {Router} from '@angular/router';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import {MatRadioButton} from '@angular/material/radio';

export interface LoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface LoginResponse {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: string;
  actif: boolean;
}

@Component({
  selector: 'app-page-connexion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    Header,
    Footer,
    MatRadioButton
  ],
  templateUrl: './page-connexion.html',
  styleUrl: './page-connexion.css'
})
export class PageConnexion {
  loginForm: FormGroup;

  // Signals pour la gestion d'état
  isLoading = signal(false);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
    // private authService: AuthService // À décommenter quand le service sera créé
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        mot_de_passe: this.loginForm.value.motDePasse
      };

      // Simulation d'appel API - À remplacer par le vrai service
      this.simulateLogin(loginData);

      // Code réel à utiliser avec le service:
      /*
      this.authService.login(loginData).subscribe({
        next: (response: LoginResponse) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
      */
    } else {
      this.markFormGroupTouched();
    }
  }

  // Simulation d'une connexion (à supprimer quand le service sera prêt)
  private simulateLogin(loginData: LoginRequest) {
    setTimeout(() => {
      if (loginData.email === 'citoyen@test.com' && loginData.mot_de_passe === 'password') {
        const mockResponse: LoginResponse = {
          idUtilisateur: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'citoyen@test.com',
          typeUtilisateur: 'CITOYEN',
          actif: true
        };
        this.handleLoginSuccess(mockResponse);
      } else {
        this.handleLoginError({ error: 'Identifiants invalides' });
      }
      this.isLoading.set(false);
    }, 2000);
  }

  private handleLoginSuccess(response: LoginResponse) {
    // Stocker les informations utilisateur (localStorage, sessionStorage, etc.)
    localStorage.setItem('currentUser', JSON.stringify(response));

    this.snackBar.open('Connexion réussie ! Bienvenue ' + response.prenom, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    // Redirection selon le type d'utilisateur
    switch (response.typeUtilisateur) {
      case 'CITOYEN':
        this.router.navigate(['/dashboard/citoyen']);
        break;
      case 'ADMINISTRATEUR':
        this.router.navigate(['/dashboard/admin']);
        break;
      case 'GESTIONNAIRE_VILLE':
        this.router.navigate(['/dashboard/gestionnaire']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  private handleLoginError(error: any) {
    let errorMessage = 'Une erreur est survenue lors de la connexion';

    if (error.error === 'Identifiants invalides') {
      errorMessage = 'Email ou mot de passe incorrect';
    } else if (error.status === 401) {
      errorMessage = 'Email ou mot de passe incorrect';
    } else if (error.status === 403) {
      errorMessage = 'Votre compte a été désactivé';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    }

    this.snackBar.open(errorMessage, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.hidePassword.update(current => !current);
  }

  getEmailErrorMessage() {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email requis';
    }
    if (emailControl?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    return '';
  }

  getPasswordErrorMessage() {
    const passwordControl = this.loginForm.get('motDePasse');
    if (passwordControl?.hasError('required')) {
      return 'Mot de passe requis';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return '';
  }

  onForgotPassword() {
    this.snackBar.open('Fonctionnalité de récupération de mot de passe à venir', 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  onRegister() {
    this.router.navigate(['/register']);
  }
}
