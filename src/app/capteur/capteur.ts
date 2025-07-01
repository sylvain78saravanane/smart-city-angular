import {Component, OnInit, signal, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
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

// Déclaration pour Leaflet
declare var L: any;

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
export class Capteur implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Propriétés pour la carte
  private map: any;
  private markers: any[] = [];
  isMapLoading = signal(false);
  selectedMapFilter = signal<'ALL' | 'ACTIF' | 'MAINTENANCE' | 'DEFAILLANT' | 'INACTIF'>('ALL');

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

  ngAfterViewInit() {
    // Charger Leaflet et initialiser la carte après le rendu de la vue
    this.loadLeafletAndInitMap();
  }

  ngOnDestroy() {
    // Nettoyer la carte lors de la destruction du composant
    if (this.map) {
      this.map.remove();
    }
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

  // MÉTHODE UNIQUE loadCapteurs (corrigée)
  protected loadCapteurs() {
    this.isLoading.set(true);

    this.capteurService.getAllCapteurs().subscribe({
      next: (response) => {
        this.capteurs.set(response.capteurs);
        this.dataSource.data = response.capteurs;
        this.setupPaginatorAndSort();

        // Mettre à jour la carte si elle est initialisée
        if (this.map) {
          this.updateMapMarkers();
        }
      },
      error: (error) => {
        this.showError('Erreur lors du chargement des capteurs: ' + error.message);
        // En cas d'erreur, utiliser des données simulées avec coordonnées
        this.loadSimulatedDataWithCoordinates();
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

  // MÉTHODES POUR LA CARTE
  private loadLeafletAndInitMap() {
    // Vérifier si Leaflet est déjà chargé
    if (typeof L !== 'undefined') {
      this.initializeMap();
      return;
    }

    this.isMapLoading.set(true);

    // Charger dynamiquement Leaflet CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkElement);

    // Charger dynamiquement Leaflet JS
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptElement.onload = () => {
      this.initializeMap();
      this.isMapLoading.set(false);
    };
    scriptElement.onerror = () => {
      this.showError('Erreur lors du chargement de la carte');
      this.isMapLoading.set(false);
    };
    document.head.appendChild(scriptElement);
  }

  private initializeMap() {
    // Attendre que l'élément DOM soit disponible
    setTimeout(() => {
      const mapElement = document.getElementById('capteurs-map');
      if (!mapElement) {
        console.error('Élément carte non trouvé');
        return;
      }

      try {
        // Initialiser la carte centrée sur Paris
        this.map = L.map('capteurs-map').setView([48.8566, 2.3522], 11);

        // Ajouter la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Ajouter les marqueurs des capteurs
        this.updateMapMarkers();

        // Ajuster la vue pour inclure tous les marqueurs
        this.fitMapToBounds();

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
        this.showError('Erreur lors de l\'initialisation de la carte');
      }
    }, 100);
  }

  private updateMapMarkers() {
    if (!this.map) return;

    // Supprimer les marqueurs existants
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Filtrer les capteurs selon le filtre sélectionné
    const filteredCapteurs = this.getFilteredCapteurs();

    // Ajouter les nouveaux marqueurs
    filteredCapteurs.forEach(capteur => {
      if (capteur.latitude && capteur.longitude) {
        const marker = this.createMarker(capteur);
        this.markers.push(marker);
        marker.addTo(this.map);
      }
    });
  }

  private createMarker(capteur: ResponseCapteurDTO): any {
    const color = this.getMarkerColor(capteur.statut);
    const icon = this.createCustomIcon(color);

    const marker = L.marker([capteur.latitude, capteur.longitude], { icon })
      .bindPopup(this.createPopupContent(capteur));

    return marker;
  }

  private createCustomIcon(color: string): any {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  }

  private getMarkerColor(statut: string): string {
    switch (statut) {
      case 'ACTIF': return '#10b981'; // vert
      case 'INACTIF': return '#6b7280'; // gris
      case 'MAINTENANCE': return '#f59e0b'; // orange
      case 'DEFAILLANT': return '#ef4444'; // rouge
      default: return '#6b7280';
    }
  }

  private createPopupContent(capteur: ResponseCapteurDTO): string {
    return `
      <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px; font-size: 14px;">
          ${capteur.nomCapteur}
        </div>
        <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">
          <strong>Type:</strong> ${capteur.typeCapteur}
        </div>
        <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">
          <strong>Gestionnaire:</strong> ${capteur.nomGestionnaireResponsable || 'Non assigné'}
        </div>
        ${capteur.adresseInstallation ? `
          <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">
            <strong>Adresse:</strong> ${capteur.adresseInstallation}
          </div>
        ` : ''}
        <div style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 8px;
          background: ${this.getStatusBackgroundColor(capteur.statut)};
          color: ${this.getStatusTextColor(capteur.statut)};
        ">
          ${capteur.statut}
        </div>
      </div>
    `;
  }

  private getStatusBackgroundColor(statut: string): string {
    switch (statut) {
      case 'ACTIF': return '#dcfce7';
      case 'INACTIF': return '#f3f4f6';
      case 'MAINTENANCE': return '#fef3c7';
      case 'DEFAILLANT': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }

  private getStatusTextColor(statut: string): string {
    switch (statut) {
      case 'ACTIF': return '#166534';
      case 'INACTIF': return '#374151';
      case 'MAINTENANCE': return '#92400e';
      case 'DEFAILLANT': return '#991b1b';
      default: return '#374151';
    }
  }

  private getFilteredCapteurs(): ResponseCapteurDTO[] {
    const filter = this.selectedMapFilter();
    if (filter === 'ALL') {
      return this.capteurs();
    }
    return this.capteurs().filter(capteur => capteur.statut === filter);
  }

  private fitMapToBounds() {
    if (!this.map || this.markers.length === 0) return;

    const group = new L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  // Méthodes publiques pour les actions de la carte
  setMapFilter(filter: 'ALL' | 'ACTIF' | 'MAINTENANCE' | 'DEFAILLANT' | 'INACTIF') {
    this.selectedMapFilter.set(filter);
    this.updateMapMarkers();
    if (this.markers.length > 0) {
      this.fitMapToBounds();
    }
  }

  centerMap() {
    if (this.markers.length > 0) {
      this.fitMapToBounds();
    } else {
      // Centrer sur Paris par défaut
      this.map?.setView([48.8566, 2.3522], 11);
    }
  }

  refreshMap() {
    this.updateMapMarkers();
    this.showSuccess('Carte actualisée');
  }

  getMapStats() {
    const capteurs = this.capteurs();
    return {
      total: capteurs.length,
      actifs: capteurs.filter(c => c.statut === 'ACTIF').length,
      maintenance: capteurs.filter(c => c.statut === 'MAINTENANCE').length,
      defaillants: capteurs.filter(c => c.statut === 'DEFAILLANT').length,
      inactifs: capteurs.filter(c => c.statut === 'INACTIF').length
    };
  }

  getCapteursWithCoordinates(): ResponseCapteurDTO[] {
    return this.capteurs().filter(c => c.latitude && c.longitude);
  }

  private loadSimulatedDataWithCoordinates() {
    // Données simulées avec coordonnées GPS pour la démonstration
    const capteursSimules: any[] = [
      {
        idCapteur: 1,
        nomCapteur: 'Capteur Centre-Ville #001',
        typeCapteur: 'TEMPERATURE',
        statut: 'ACTIF',
        latitude: 48.8566,
        longitude: 2.3522,
        adresseInstallation: 'Place de la République, Paris',
        nomGestionnaireResponsable: 'Marie Dubois',
        typeGestionnaire: 'GESTIONNAIRE_VILLE',
        dateInstallation: new Date('2023-06-15')
      },
      {
        idCapteur: 2,
        nomCapteur: 'Capteur Pollution #015',
        typeCapteur: 'POLLUTION',
        statut: 'MAINTENANCE',
        latitude: 48.8606,
        longitude: 2.3376,
        adresseInstallation: 'Rue de Rivoli, Paris',
        nomGestionnaireResponsable: 'Paul Leroy',
        typeGestionnaire: 'ADMINISTRATEUR',
        dateInstallation: new Date('2023-08-20')
      },
      {
        idCapteur: 3,
        nomCapteur: 'Capteur Trafic #008',
        typeCapteur: 'TRAFIC',
        statut: 'DEFAILLANT',
        latitude: 48.8738,
        longitude: 2.2950,
        adresseInstallation: 'Avenue des Champs-Élysées, Paris',
        nomGestionnaireResponsable: 'Marie Dubois',
        typeGestionnaire: 'GESTIONNAIRE_VILLE',
        dateInstallation: new Date('2023-05-10')
      },
      {
        idCapteur: 4,
        nomCapteur: 'Capteur Humidité #022',
        typeCapteur: 'HUMIDITE',
        statut: 'ACTIF',
        latitude: 48.8529,
        longitude: 2.3500,
        adresseInstallation: 'Île Saint-Louis, Paris',
        nomGestionnaireResponsable: 'Jean Martin',
        typeGestionnaire: 'GESTIONNAIRE_VILLE',
        dateInstallation: new Date('2023-07-12')
      },
      {
        idCapteur: 5,
        nomCapteur: 'Capteur Bruit #033',
        typeCapteur: 'BRUIT',
        statut: 'ACTIF',
        latitude: 48.8584,
        longitude: 2.2945,
        adresseInstallation: 'Tour Eiffel, Paris',
        nomGestionnaireResponsable: 'Sophie Moreau',
        typeGestionnaire: 'CHERCHEUR',
        dateInstallation: new Date('2023-09-05')
      },
      {
        idCapteur: 6,
        nomCapteur: 'Capteur Lumière #044',
        typeCapteur: 'LUMINOSITE',
        statut: 'INACTIF',
        latitude: 48.8606,
        longitude: 2.3354,
        adresseInstallation: 'Musée du Louvre, Paris',
        nomGestionnaireResponsable: 'Pierre Bernard',
        typeGestionnaire: 'CHERCHEUR',
        dateInstallation: new Date('2023-04-18')
      }
    ];

    this.capteurs.set(capteursSimules);
    this.dataSource.data = capteursSimules;

    if (this.map) {
      this.updateMapMarkers();
    }
  }

  // FORMULAIRES
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
