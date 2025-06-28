import {Component, OnInit, signal, ViewChild} from '@angular/core';
import {Footer} from '../footer/footer';
import {Header} from '../header/header';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatChipsModule} from '@angular/material/chips';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AdminLoginResponse, AuthService} from '../services/auth.service';
import {CapteurService, CreateCapteurDTO, ResponseCapteurDTO, UpdateCapteurDTO} from '../services/capteur-service';
import {Router} from '@angular/router';
import {ConfirmDeleteDialogComponent} from './confirm-delete-dialog-component/confirm-delete-dialog-component';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';




@Component({
  selector: 'app-capteur',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    Header,
    Footer,
    MatMenu,
    MatMenuTrigger
  ],
  templateUrl: './capteur.html',
  styleUrl: './capteur.css'
})
export class Capteur implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Signals pour la gestion d'état
  currentAdmin = signal<AdminLoginResponse | null>(null);
  capteurs = signal<ResponseCapteurDTO[]>([]);
  isLoading = signal(false);
  isCreating = signal(false);
  selectedCapteur = signal<ResponseCapteurDTO | null>(null);
  showCreateForm = signal(false);
  showEditForm = signal(false);

  // Formulaires
  createForm: FormGroup;
  editForm: FormGroup;
  searchForm: FormGroup;

  // Table
  dataSource = new MatTableDataSource<ResponseCapteurDTO>();
  displayedColumns: string[] = [
    'nomCapteur',
    'typeCapteur',
    'statut',
    'adresse',
    'gestionnaire',
    'dateInstallation',
    'actions'
  ];

  // Options pour les selects
  typesCapteurs: string[] = [];
  statutsCapteurs: string[] = [];

  constructor(
    private fb: FormBuilder,
    private capteurService: CapteurService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.createForm = this.createFormGroup();
    this.editForm = this.createFormGroup();
    this.searchForm = this.createSearchForm();
  }

  ngOnInit() {
    this.loadAdminInfo();
    this.initializeSelectOptions();
    this.loadCapteurs();
    this.setupTableFiltering();
  }

  private initializeSelectOptions() {
    this.typesCapteurs = this.capteurService.getTypesCapteurs();
    this.statutsCapteurs = this.capteurService.getStatutsCapteurs();
  }

  private loadAdminInfo() {
    const user = this.authService.getCurrentUser() as AdminLoginResponse;

    if (!user || user.role !== 'ADMINISTRATEUR') {
      this.router.navigate(['/login/administrateur']);
      return;
    }

    this.currentAdmin.set(user);
  }

  protected loadCapteurs() {
    this.isLoading.set(true);

    this.capteurService.getAllCapteurs().subscribe({
      next: (response) => {
        this.capteurs.set(response.capteurs);
        this.dataSource.data = response.capteurs;
        this.setupPaginatorAndSort();
      },
      error: (error) => {
        this.showError('Erreur lors du chargement des capteurs: ' + error.message);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  private setupPaginatorAndSort() {
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  private setupTableFiltering() {
    this.searchForm.get('search')?.valueChanges.subscribe(value => {
      this.dataSource.filter = value?.trim().toLowerCase() || '';
    });
  }

  private createFormGroup(): FormGroup {
    return this.fb.group({
      nomCapteur: ['', [Validators.required, Validators.maxLength(100)]],
      typeCapteur: ['', Validators.required],
      description: ['', Validators.maxLength(255)],
      latitude: ['', [Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.min(-180), Validators.max(180)]],
      adresseInstallation: ['', Validators.maxLength(200)],
      statut: ['ACTIF'],
      frequenceMesure: ['', [Validators.min(1), Validators.max(1440)]],
      uniteMesure: ['', Validators.maxLength(20)],
      valeurMin: [''],
      valeurMax: [''],
      numeroSerie: ['', Validators.maxLength(50)],
      modele: ['', Validators.maxLength(50)],
      fabricant: ['', Validators.maxLength(50)]
    }, { validators: this.valeurMinMaxValidator });
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      search: ['']
    });
  }

  private valeurMinMaxValidator(form: FormGroup) {
    const valeurMin = form.get('valeurMin')?.value;
    const valeurMax = form.get('valeurMax')?.value;

    if (valeurMin !== null && valeurMax !== null &&
      valeurMin !== '' && valeurMax !== '' &&
      parseFloat(valeurMin) > parseFloat(valeurMax)) {
      return { valeurMinMaxInvalid: true };
    }
    return null;
  }

  // Actions CRUD
  onCreateCapteur() {
    if (this.createForm.valid) {
      this.isCreating.set(true);

      const admin = this.currentAdmin();
      if (!admin) {
        this.showError('Impossible de récupérer les informations administrateur');
        return;
      }

      const formData = this.createForm.value;
      const capteurData: CreateCapteurDTO = {
        ...formData,
        idGestionnaireResponsable: admin.idUtilisateur,
        typeGestionnaire: 'ADMINISTRATEUR'
      };

      this.capteurService.createCapteur(capteurData).subscribe({
        next: (newCapteur) => {
          this.showSuccess('Capteur créé avec succès !');
          this.loadCapteurs();
          this.resetCreateForm();
          this.showCreateForm.set(false);
        },
        error: (error) => {
          this.showError('Erreur lors de la création: ' + error.message);
        },
        complete: () => {
          this.isCreating.set(false);
        }
      });
    } else {
      this.markFormGroupTouched(this.createForm);
    }
  }

  onEditCapteur(capteur: ResponseCapteurDTO) {
    this.selectedCapteur.set(capteur);
    this.populateEditForm(capteur);
    this.showEditForm.set(true);
  }

  onUpdateCapteur() {
    if (this.editForm.valid && this.selectedCapteur()) {
      this.isCreating.set(true);

      const formData = this.editForm.value;
      const updateData: UpdateCapteurDTO = {
        idCapteur: this.selectedCapteur()!.idCapteur,
        ...formData
      };

      this.capteurService.updateCapteur(updateData).subscribe({
        next: (updatedCapteur) => {
          this.showSuccess('Capteur mis à jour avec succès !');
          this.loadCapteurs();
          this.cancelEdit();
        },
        error: (error) => {
          this.showError('Erreur lors de la mise à jour: ' + error.message);
        },
        complete: () => {
          this.isCreating.set(false);
        }
      });
    } else {
      this.markFormGroupTouched(this.editForm);
    }
  }

  onDeleteCapteur(capteur: ResponseCapteurDTO) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer le capteur "${capteur.nomCapteur}" ?`,
        capteur: capteur
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteCapteur(capteur.idCapteur);
      }
    });
  }

  private deleteCapteur(id: number) {
    this.capteurService.deleteCapteur(id).subscribe({
      next: (response) => {
        this.showSuccess('Capteur supprimé avec succès !');
        this.loadCapteurs();
      },
      error: (error) => {
        this.showError('Erreur lors de la suppression: ' + error.message);
      }
    });
  }

  onCollecterDonnees(capteur: ResponseCapteurDTO) {
    this.capteurService.collecterDonneesManuellement(capteur.idCapteur).subscribe({
      next: (response) => {
        this.showSuccess(`Collecte démarrée pour ${capteur.nomCapteur}`);
      },
      error: (error) => {
        this.showError('Erreur lors de la collecte: ' + error.message);
      }
    });
  }

  // Gestion des formulaires
  private populateEditForm(capteur: ResponseCapteurDTO) {
    this.editForm.patchValue({
      nomCapteur: capteur.nomCapteur,
      typeCapteur: capteur.typeCapteur,
      description: capteur.description,
      latitude: capteur.latitude,
      longitude: capteur.longitude,
      adresseInstallation: capteur.adresseInstallation,
      statut: capteur.statut,
      frequenceMesure: capteur.frequenceMesure,
      uniteMesure: capteur.uniteMesure,
      valeurMin: capteur.valeurMin,
      valeurMax: capteur.valeurMax,
      numeroSerie: capteur.numeroSerie,
      modele: capteur.modele,
      fabricant: capteur.fabricant
    });
  }

  private resetCreateForm() {
    this.createForm.reset();
    this.createForm.patchValue({ statut: 'ACTIF' });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancelCreate() {
    this.resetCreateForm();
    this.showCreateForm.set(false);
  }

  cancelEdit() {
    this.editForm.reset();
    this.selectedCapteur.set(null);
    this.showEditForm.set(false);
  }

  // Méthodes utilitaires
  getStatutColor(statut: string): string {
    return this.capteurService.getStatutColor(statut);
  }

  getTypeCapteurIcon(type: string): string {
    return this.capteurService.getTypeCapteurIcon(type);
  }

  formatAdresse(capteur: ResponseCapteurDTO): string {
    return this.capteurService.formatAdresseAffichage(capteur);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Non renseignée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Navigation
  goBack() {
    this.router.navigate(['/dashboard/administrateur']);
  }

  logout() {
    this.authService.logoutAdmin();
    this.router.navigate(['/login/administrateur']);
    console.log("Vous vous êtes déconnecté");
  }

  protected readonly length = length;
}
