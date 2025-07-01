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
import {MatSelectModule} from '@angular/material/select';
import {MatDividerModule} from '@angular/material/divider';
import {Header} from '../header/header';
import {Router} from '@angular/router';
import {Footer} from '../footer/footer';
import {AuthService, LoginRequest, LoginResponse} from '../services/auth.service';

@Component({
  selector: 'app-page-connexion-chercheur',
  standalone:true,
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
    MatSelectModule,
    MatDividerModule,
    Header,
    Footer,],
  templateUrl: './page-connexion-chercheur.html',
  styleUrl: './page-connexion-chercheur.css'
})
export class PageConnexionChercheur {
  chercheurLoginForm: FormGroup;

  // Signals pour la gestion d'état
  isLoading = signal(false);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.chercheurLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.chercheurLoginForm.valid) {
      this.isLoading.set(true);

      const loginData: LoginRequest = {
        email: this.chercheurLoginForm.value.email,
        mot_de_passe: this.chercheurLoginForm.value.motDePasse
      };

      // Appel au service d'authentification
      this.authService.login(loginData).subscribe({
        next: (response: LoginResponse) => {
          // Vérifier que l'utilisateur est bien un chercheur
          if (response.role === 'CHERCHEUR' || response.typeUtilisateur === 'CHERCHEUR') {
            this.handleLoginSuccess(response);
          } else {
            this.handleLoginError(new Error('Accès refusé - Compte chercheur requis'));
          }
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

  private handleLoginSuccess(response: LoginResponse) {

    // Message de bienvenue personnalisé pour les chercheurs
    const welcomeMessage = response.donneesSpecifiques?.institut
      ? `Connexion réussie ! Bienvenue Dr. ${response.prenom} ${response.nom} (${response.donneesSpecifiques.institut})`
      : `Connexion réussie ! Bienvenue Dr. ${response.prenom} ${response.nom}`;

    this.snackBar.open(welcomeMessage, 'Fermer', {
      duration: 4000,
      panelClass: ['success-snackbar']
    });

    this.router.navigate(['/dashboard/chercheur']);
  }

  private handleLoginError(error: any) {
    let errorMessage = 'Une erreur est survenue lors de la connexion';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Messages d'erreur spécifiques aux chercheurs
    if (errorMessage.includes('Accès refusé - Compte chercheur requis')) {
      errorMessage = 'Ce compte n\'est pas associé à un profil de chercheur. Contactez l\'administration.';
    } else if (errorMessage.includes('Email ou mot de passe incorrect')) {
      errorMessage = 'Email institutionnel ou mot de passe incorrect';
    } else if (errorMessage.includes('Compte désactivé')) {
      errorMessage = 'Votre compte chercheur a été désactivé. Contactez votre institut.';
    }

    this.snackBar.open(errorMessage, 'Fermer', {
      duration: 6000,
      panelClass: ['error-snackbar']
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.chercheurLoginForm.controls).forEach(key => {
      const control = this.chercheurLoginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.hidePassword.update(current => !current);
  }

  getEmailErrorMessage() {
    const emailControl = this.chercheurLoginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email requis';
    }
    if (emailControl?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    return '';
  }

  getPasswordErrorMessage() {
    const passwordControl = this.chercheurLoginForm.get('motDePasse');
    if (passwordControl?.hasError('required')) {
      return 'Mot de passe requis';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return '';
  }

  onForgotPassword() {
    this.snackBar.open(
      'Pour récupérer votre mot de passe, contactez le support de votre institut ou l\'administration à support@smartcityiot.fr',
      'Fermer',
      {
        duration: 7000,
        panelClass: ['info-snackbar']
      }
    );
  }

  onReturnToLogin() {
    this.router.navigate(['/login']);
  }

  onAccessRequest() {
    this.snackBar.open(
      'Pour demander un accès chercheur, envoyez un email avec vos justificatifs à admin@smartcityiot.fr',
      'Fermer',
      {
        duration: 8000,
        panelClass: ['info-snackbar']
      }
    );
  }

  // Gestion d'erreur pour l'image
  onImageError(event: any) {
    console.log('Erreur de chargement de l\'image:', event);
    event.target.style.display = 'none';
    const fallbackIcon = document.querySelector('#fallbackIcon');
    if (fallbackIcon) {
      fallbackIcon.classList.remove('hidden');
    }
  }
}
