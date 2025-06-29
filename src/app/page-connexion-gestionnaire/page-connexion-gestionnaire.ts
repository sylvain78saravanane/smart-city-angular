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
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../services/auth.service';

export interface GestionnaireLoginRequest {
  email: string;
  mot_de_passe: string;
  code_gv: string;
}

@Component({
  selector: 'app-page-connexion-gestionnaire',
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
  ],
  templateUrl: './page-connexion-gestionnaire.html',
  styleUrl: './page-connexion-gestionnaire.css'
})
export class PageConnexionGestionnaire {
  loginForm: FormGroup;

  // Signals pour la gestion d'état
  isLoading = signal(false);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      codeGV: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const loginData: GestionnaireLoginRequest = {
        email: this.loginForm.value.email,
        mot_de_passe: this.loginForm.value.motDePasse,
        code_gv: this.loginForm.value.codeGV
      };

      // Utiliser la méthode de connexion gestionnaire (à créer dans AuthService)
      this.authService.loginGestionnaire(loginData).subscribe({
        next: (response) => {
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleLoginSuccess(response: any) {
    this.snackBar.open('Connexion réussie ! Bienvenue ' + response.prenom, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    // Redirection vers le dashboard gestionnaire
    this.router.navigate(['/dashboard/gestionnaire']);
  }

  private handleLoginError(error: any) {
    let errorMessage = 'Une erreur est survenue lors de la connexion';

    if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 400) {
      errorMessage = 'Email, mot de passe et code gestionnaire requis';
    } else if (error.status === 401) {
      errorMessage = 'Identifiants gestionnaire invalides';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé - Droits gestionnaire insuffisants';
    } else if (error.status === 422) {
      errorMessage = 'Le code gestionnaire doit contenir exactement 4 chiffres';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur - Contactez le support technique';
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

  getCodeGVErrorMessage() {
    const codeControl = this.loginForm.get('codeGV');
    if (codeControl?.hasError('required')) {
      return 'Code gestionnaire requis';
    }
    if (codeControl?.hasError('pattern')) {
      return 'Le code gestionnaire doit contenir exactement 4 chiffres';
    }
    return '';
  }

  onForgotPassword() {
    this.snackBar.open('Contactez votre administrateur pour récupérer votre mot de passe', 'Fermer', {
      duration: 5000,
      panelClass: ['info-snackbar']
    });
  }

  onBackToLogin() {
    this.router.navigate(['/login']);
  }
}
