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
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatStepperModule} from '@angular/material/stepper';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import { Router } from '@angular/router';
import {AuthService, CreateUtilisateurDTO, ResponseUtilisateurDTO} from '../services/auth.service';


@Component({
  selector: 'app-page-inscription-citoyen',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    MatCheckboxModule,
    Header,
    Footer,],
  templateUrl: './page-inscription-citoyen.html',
  styleUrl: './page-inscription-citoyen.css'
})
export class PageInscriptionCitoyen {
  inscriptionForm: FormGroup;

  // Signals pour la gestion d'état
  isLoading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  currentStep = signal(0);

  // Géolocalisation
  locationLoading = signal(false);
  locationError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.inscriptionForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Étape 1: Informations personnelles
      informationsPersonnelles: this.fb.group({
        nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        dateNaissance: ['', [Validators.required, this.validateAge]],
        telephone: ['', [Validators.pattern(/^[0-9+\-\s]{10,14}$/)]],
      }),

      // Étape 2: Adresse
      adresse: this.fb.group({
        numeroRue: ['', [Validators.maxLength(10)]],
        adresse: ['', [Validators.required, Validators.maxLength(100)]],
        codePostal: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/), Validators.maxLength(7)]],
      }),

      // Étape 3: Mot de passe et localisation
      securite: this.fb.group({
        motDePasse: ['', [Validators.required, Validators.minLength(6)]],
        confirmMotDePasse: ['', [Validators.required]],
        latitude: [null],
        longitude: [null],
        accepterCGU: [false, [Validators.requiredTrue]],
        accepterGeolocalisation: [false]
      }, { validators: this.passwordMatchValidator })
    });
  }

  // Validators personnalisés
  private validateAge(control: any) {
    if (!control.value) return null;

    const today = new Date();
    const birthDate = new Date(control.value);
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 13) {
      return { ageMinimum: { message: 'Vous devez avoir au moins 13 ans' } };
    }

    if (age > 120) {
      return { ageMaximum: { message: 'Âge non valide' } };
    }

    return null;
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('motDePasse')?.value;
    const confirmPassword = group.get('confirmMotDePasse')?.value;

    if (password !== confirmPassword) {
      group.get('confirmMotDePasse')?.setErrors({ mismatch: true });
      return { passwordMismatch: true };
    }

    group.get('confirmMotDePasse')?.setErrors(null);
    return null;
  }

  // Gestion des étapes
  nextStep() {
    const currentStepGroup = this.getCurrentStepGroup();
    if (currentStepGroup && currentStepGroup.valid) {
      this.currentStep.update(step => Math.min(step + 1, 2));
    } else {
      this.markGroupAsTouched(currentStepGroup);
      this.snackBar.open('Veuillez corriger les erreurs avant de continuer', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  previousStep() {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  private getCurrentStepGroup(): FormGroup | null {
    const stepNames = ['informationsPersonnelles', 'adresse', 'securite'];
    const stepName = stepNames[this.currentStep()];
    return this.inscriptionForm.get(stepName) as FormGroup;
  }

  private markGroupAsTouched(group: FormGroup | null) {
    if (!group) return;

    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      control?.markAsTouched();
    });
  }

  // Géolocalisation
  obtenirLocalisation() {
    if (!navigator.geolocation) {
      this.locationError.set('La géolocalisation n\'est pas supportée par ce navigateur');
      return;
    }

    this.locationLoading.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        this.inscriptionForm.patchValue({
          securite: {
            latitude: lat,
            longitude: lng,
            accepterGeolocalisation: true
          }
        });

        this.locationLoading.set(false);
        this.snackBar.open('Localisation récupérée avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      (error) => {
        this.locationLoading.set(false);
        let errorMessage = 'Erreur lors de la récupération de la localisation';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localisation non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout lors de la récupération de la localisation';
            break;
        }

        this.locationError.set(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  // Soumission du formulaire
  onSubmit() {
    if (this.inscriptionForm.valid) {
      this.isLoading.set(true);

      const formData = this.inscriptionForm.value;
      const inscriptionData: CreateUtilisateurDTO = {
        nom: formData.informationsPersonnelles.nom,
        prenom: formData.informationsPersonnelles.prenom,
        email: formData.informationsPersonnelles.email,
        motDePasse: formData.securite.motDePasse,
        dateNaissance: this.formatDate(formData.informationsPersonnelles.dateNaissance),
        telephone: formData.informationsPersonnelles.telephone || '',
        numeroRue: formData.adresse.numeroRue || '',
        adresse: formData.adresse.adresse,
        codePostal: formData.adresse.codePostal,
        typeUtilisateur: 'CITOYEN',
        donneesSpecifiques: {
          latitude: formData.securite.latitude,
          longitude: formData.securite.longitude
        }
      };

      this.authService.register(inscriptionData).subscribe({
        next: (response: ResponseUtilisateurDTO) => {
          this.handleInscriptionSuccess(response);
        },
        error: (error) => {
          this.handleInscriptionError(error);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      this.markAllAsTouched();
      this.snackBar.open('Veuillez corriger toutes les erreurs', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  private handleInscriptionSuccess(response: ResponseUtilisateurDTO) {
    this.snackBar.open(
      `Inscription réussie ! Bienvenue ${response.prenom} ${response.nom}`,
      'Fermer',
      {
        duration: 5000,
        panelClass: ['success-snackbar']
      }
    );

    // Redirection vers la page de connexion après un délai
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: {
          email: response.email,
          message: 'Inscription réussie, vous pouvez maintenant vous connecter'
        }
      });
    }, 2000);
  }

  private handleInscriptionError(error: any) {
    let errorMessage = 'Une erreur est survenue lors de l\'inscription';

    if (error.error && typeof error.error === 'object') {
      if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.status === 400) {
      errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
    } else if (error.status === 409) {
      errorMessage = 'Un compte avec cet email existe déjà';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    }

    this.snackBar.open(errorMessage, 'Fermer', {
      duration: 7000,
      panelClass: ['error-snackbar']
    });
  }

  private markAllAsTouched() {
    this.markGroupAsTouched(this.inscriptionForm.get('informationsPersonnelles') as FormGroup);
    this.markGroupAsTouched(this.inscriptionForm.get('adresse') as FormGroup);
    this.markGroupAsTouched(this.inscriptionForm.get('securite') as FormGroup);
  }

  // Getters pour les messages d'erreur
  getErrorMessage(groupName: string, fieldName: string): string {
    const control = this.inscriptionForm.get(`${groupName}.${fieldName}`);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    if (control?.hasError('maxlength')) {
      return `Maximum ${control.errors?.['maxlength'].requiredLength} caractères`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'telephone') {
        return 'Format de téléphone invalide';
      }
      if (fieldName === 'codePostal') {
        return 'Code postal invalide (5 chiffres)';
      }
    }
    if (control?.hasError('ageMinimum')) {
      return control.errors?.['ageMinimum'].message;
    }
    if (control?.hasError('ageMaximum')) {
      return control.errors?.['ageMaximum'].message;
    }
    if (control?.hasError('mismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }

  // Utilitaires
  togglePasswordVisibility() {
    this.hidePassword.update(current => !current);
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword.update(current => !current);
  }

  onLogin() {
    this.router.navigate(['/login']);
  }

  // Vérification de la validité des étapes
  isStepValid(stepIndex: number): boolean {
    const stepNames = ['informationsPersonnelles', 'adresse', 'securite'];
    const stepGroup = this.inscriptionForm.get(stepNames[stepIndex]) as FormGroup;
    return stepGroup ? stepGroup.valid : false;
  }

  getStepIcon(stepIndex: number): string {
    if (this.currentStep() > stepIndex || this.isStepValid(stepIndex)) {
      return 'check_circle';
    }
    return stepIndex === this.currentStep() ? 'radio_button_checked' : 'radio_button_unchecked';
  }
}
