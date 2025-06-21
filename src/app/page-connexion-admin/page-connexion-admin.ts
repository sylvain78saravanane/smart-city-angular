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

export interface AdminLoginRequest {
  email: string;
  mot_de_passe: string;
  code_admin: string;
}

export interface AdminLoginResponse {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: string;
  actif: boolean;
  donneesSpecifiques: {
    codeAdmin: string;
    salaire: number;
    type: 'ADMINISTRATEUR';
  };
}

@Component({
  selector: 'app-page-connexion-admin',
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
    Header,
    Footer,
    RouterLink,
  ],
  templateUrl: './page-connexion-admin.html',
  styleUrl: './page-connexion-admin.css'
})
export class PageConnexionAdmin {
  adminLoginForm: FormGroup;

  // Signals pour la gestion d'état
  isLoading = signal(false);
  hidePassword = signal(true);
  hideCodeAdmin = signal(true);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.adminLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      codeAdmin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]], // Exactement 4 chiffres
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.adminLoginForm.valid) {
      this.isLoading.set(true);

      const loginData: AdminLoginRequest = {
        email: this.adminLoginForm.value.email,
        mot_de_passe: this.adminLoginForm.value.motDePasse,
        code_admin: this.adminLoginForm.value.codeAdmin
      };

      // Appel au service d'authentification admin
      this.authService.loginAdmin(loginData).subscribe({
        next: (response: AdminLoginResponse) => {
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

  private handleLoginSuccess(response: AdminLoginResponse) {
    // Stocker les informations administrateur
    localStorage.setItem('currentUser', JSON.stringify(response));
    localStorage.setItem('userRole', 'ADMINISTRATEUR');

    this.snackBar.open(
      `Connexion administrateur réussie ! Bienvenue ${response.prenom}`,
      'Fermer',
      {
        duration: 3000,
        panelClass: ['success-snackbar']
      }
    );

    // Redirection vers le dashboard administrateur
    this.router.navigate(['/dashboard/administrateur']);
  }

  private handleLoginError(error: any) {
    let errorMessage = 'Une erreur est survenue lors de la connexion';

    if (error.error === 'Identifiants invalides') {
      errorMessage = 'Email, mot de passe ou code administrateur incorrect';
    } else if (error.status === 401) {
      errorMessage = 'Accès refusé - Vérifiez vos identifiants administrateur';
    } else if (error.status === 403) {
      errorMessage = 'Votre compte administrateur a été désactivé';
    } else if (error.status === 422) {
      errorMessage = 'Code administrateur invalide - 4 chiffres requis';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    }

    this.snackBar.open(errorMessage, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.adminLoginForm.controls).forEach(key => {
      const control = this.adminLoginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.hidePassword.update(current => !current);
  }

  toggleCodeAdminVisibility() {
    this.hideCodeAdmin.update(current => !current);
  }

  getEmailErrorMessage() {
    const emailControl = this.adminLoginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email requis';
    }
    if (emailControl?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    return '';
  }

  getPasswordErrorMessage() {
    const passwordControl = this.adminLoginForm.get('motDePasse');
    if (passwordControl?.hasError('required')) {
      return 'Mot de passe requis';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return '';
  }

  getCodeAdminErrorMessage() {
    const codeControl = this.adminLoginForm.get('codeAdmin');
    if (codeControl?.hasError('required')) {
      return 'Code administrateur requis';
    }
    if (codeControl?.hasError('pattern')) {
      return 'Le code doit contenir exactement 4 chiffres';
    }
    return '';
  }

  onForgotPassword() {
    this.snackBar.open(
      'Contactez le support technique pour récupérer votre accès administrateur',
      'Fermer',
      {
        duration: 5000,
        panelClass: ['info-snackbar']
      }
    );
  }

  onReturnToLogin() {
    this.router.navigate(['/login']);
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

  // Formatage automatique du code admin (optionnel)
  onCodeAdminInput(event: any) {
    const input = event.target;
    const value = input.value.replace(/\D/g, '').slice(0, 4); // Garde seulement les chiffres, max 4
    this.adminLoginForm.patchValue({ codeAdmin: value });
  }
}
