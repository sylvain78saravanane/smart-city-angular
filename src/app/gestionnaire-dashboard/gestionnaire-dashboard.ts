// src/app/gestionnaire-dashboard/gestionnaire-dashboard.ts - Version avec rapports intégrés

import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule } from '@angular/material/toolbar';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../services/auth.service';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import {DonneeIoTDTO, DonneeIoTService} from '../services/donnee-io-tservice';
import {CapteurService, ResponseCapteurDTO} from '../services/capteur-service';
import {Subscription} from 'rxjs';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {CapteurDisponible, RapportGestionnaireService} from '../services/rapport-gestionnaire-service';

@Component({
  selector: 'app-gestionnaire-dashboard',
  standalone : true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatProgressBarModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    ReactiveFormsModule,
    Footer,
    Header,
    MatProgressSpinner
  ],
  templateUrl: './gestionnaire-dashboard.html',
  styleUrl: './gestionnaire-dashboard.css'
})
export class GestionnaireDashboard implements OnInit, OnDestroy {

  currentUser: LoginResponse | null = null;
  mesCapteurs: ResponseCapteurDTO[] = [];
  donneesSynthese: { [capteurId: number]: DonneeIoTDTO } = {};
  isLoading = true;
  error: string | null = null;

  // Formulaire pour génération de rapport
  rapportForm: FormGroup;
  isGeneratingReport = false;

  // Nouveau: Variables pour les rapports intégrés
  tousLesCapteurs: CapteurDisponible[] = [];
  rapportIntegreForm: FormGroup;
  isLoadingCapteurs = false;
  nombreDonneesRapport = 0;
  capteurSelectionneRapport: CapteurDisponible | null = null;

  // Configuration des dates pour les rapports
  maxDateRapport = new Date();
  minDateRapport = new Date(2020, 0, 1);

  // Subscriptions
  private dataSubscription?: Subscription;
  private refreshInterval?: number;
  private readonly REFRESH_INTERVAL = 60000;

  // Colonnes du tableau
  displayedColumns: string[] = ['nom', 'type', 'statut', 'temperature', 'qualiteAir', 'actions'];

  constructor(
    private authService: AuthService,
    private router: Router,
    public capteurService: CapteurService,
    private donneeIoTService: DonneeIoTService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private rapportGestionnaireService: RapportGestionnaireService // Nouveau service
  ) {
    this.rapportForm = this.fb.group({
      capteurId: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      format: ['CSV', Validators.required]
    });

    // Nouveau formulaire pour rapports intégrés
    this.rapportIntegreForm = this.fb.group({
      capteurId: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required]
    });

    // Définir des dates par défaut (7 derniers jours)
    const maintenant = new Date();
    const septJoursAvant = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.rapportIntegreForm.patchValue({
      dateDebut: septJoursAvant,
      dateFin: maintenant
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'GESTIONNAIRE_VILLE') {
      this.router.navigate(['/login/gestionnaire']);
      return;
    }

    this.loadMesCapteurs();
    this.startDataRefresh();

    // Nouveau: Charger tous les capteurs pour les rapports
    this.chargerTousLesCapteurs();
    this.ecouterChangementsRapport();
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ========== MÉTHODES EXISTANTES (inchangées) ==========

  loadMesCapteurs() {
    this.isLoading = true;

    if (!this.currentUser) return;

    this.capteurService.getCapteursByGestionnaire(this.currentUser.idUtilisateur).subscribe({
      next: (response) => {
        this.mesCapteurs = response.capteurs || [];
        console.log('📊 Capteurs gérés par ce gestionnaire:', this.mesCapteurs);

        if (this.mesCapteurs.length === 0) {
          console.warn('⚠️ Aucun capteur assigné à ce gestionnaire');
          this.isLoading = false;
          return;
        }

        this.loadDonneesPourTousLesCapteurs();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des capteurs:', error);
        this.error = error.message;
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des capteurs assignés', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadDonneesPourTousLesCapteurs() {
    if (this.mesCapteurs.length === 0) {
      this.isLoading = false;
      return;
    }

    let capteursTraites = 0;
    const totalCapteurs = this.mesCapteurs.length;

    this.mesCapteurs.forEach(capteur => {
      this.donneeIoTService.getLatestDonneesByCapteur(capteur.idCapteur, 1).subscribe({
        next: (response) => {
          if (response.donnees && response.donnees.length > 0) {
            this.donneesSynthese[capteur.idCapteur] = response.donnees[0];
          }
          capteursTraites++;

          if (capteursTraites === totalCapteurs) {
            this.isLoading = false;
            console.log('✅ Données chargées pour tous les capteurs');
          }
        },
        error: (error) => {
          console.error(`❌ Erreur données capteur ${capteur.idCapteur}:`, error);
          capteursTraites++;

          if (capteursTraites === totalCapteurs) {
            this.isLoading = false;
          }
        }
      });
    });
  }

  startDataRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadDonneesPourTousLesCapteurs();
    }, this.REFRESH_INTERVAL);
  }

  refreshData() {
    this.loadMesCapteurs();
    this.snackBar.open('Données actualisées', 'Fermer', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  // ========== NOUVELLES MÉTHODES POUR RAPPORTS INTÉGRÉS ==========

  /**
   * Charger tous les capteurs disponibles pour les rapports
   */
  chargerTousLesCapteurs() {
    this.isLoadingCapteurs = true;

    this.rapportGestionnaireService.getCapteursDisponibles().subscribe({
      next: (response) => {
        this.tousLesCapteurs = response.capteurs;
        console.log('📋 Tous les capteurs chargés pour rapports:', this.tousLesCapteurs.length);
        this.isLoadingCapteurs = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement tous capteurs:', error);
        this.snackBar.open('Erreur lors du chargement des capteurs', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoadingCapteurs = false;
      }
    });
  }

  /**
   * Écouter les changements dans le formulaire de rapport
   */
  ecouterChangementsRapport() {
    // Changement de capteur
    this.rapportIntegreForm.get('capteurId')?.valueChanges.subscribe(capteurId => {
      this.capteurSelectionneRapport = this.tousLesCapteurs.find(c => c.idCapteur === capteurId) || null;
      this.verifierDisponibiliteDonneesRapport();
    });

    // Changements de dates
    this.rapportIntegreForm.get('dateDebut')?.valueChanges.subscribe(() => {
      this.verifierDisponibiliteDonneesRapport();
    });

    this.rapportIntegreForm.get('dateFin')?.valueChanges.subscribe(() => {
      this.verifierDisponibiliteDonneesRapport();
    });
  }

  /**
   * Vérifier la disponibilité des données pour le rapport
   */
  verifierDisponibiliteDonneesRapport() {
    const formValue = this.rapportIntegreForm.value;

    if (formValue.capteurId && formValue.dateDebut && formValue.dateFin) {
      // Valider la période
      const erreurPeriode = this.rapportGestionnaireService.validerPeriode(formValue.dateDebut, formValue.dateFin);
      if (erreurPeriode) {
        this.nombreDonneesRapport = 0;
        return;
      }

      // Compter les données disponibles
      const dateDebut = this.rapportGestionnaireService.formatDateForAPI(formValue.dateDebut);
      const dateFin = this.rapportGestionnaireService.formatDateForAPI(formValue.dateFin);

      this.rapportGestionnaireService.compterDonneesPeriode(formValue.capteurId, dateDebut, dateFin).subscribe({
        next: (response) => {
          this.nombreDonneesRapport = response.nombre_donnees;
        },
        error: (error) => {
          console.error('❌ Erreur comptage données rapport:', error);
          this.nombreDonneesRapport = 0;
        }
      });
    } else {
      this.nombreDonneesRapport = 0;
    }
  }

  /**
   * Définir une période prédéfinie pour le rapport
   */
  definirPeriodeRapport(jours: number) {
    const maintenant = new Date();
    const debut = new Date(maintenant.getTime() - jours * 24 * 60 * 60 * 1000);

    this.rapportIntegreForm.patchValue({
      dateDebut: debut,
      dateFin: maintenant
    });
  }

  /**
   * Générer et télécharger le rapport CSV intégré
   */
  genererRapportIntegre() {
    if (this.rapportIntegreForm.valid && this.capteurSelectionneRapport) {
      this.isGeneratingReport = true;

      const formValue = this.rapportIntegreForm.value;
      const dateDebut = this.rapportGestionnaireService.formatDateForAPI(formValue.dateDebut);
      const dateFin = this.rapportGestionnaireService.formatDateForAPI(formValue.dateFin);

      console.log('🔄 Génération rapport intégré pour:', {
        capteur: this.capteurSelectionneRapport.nomCapteur,
        dateDebut,
        dateFin,
        nombreDonnees: this.nombreDonneesRapport
      });

      this.rapportGestionnaireService.telechargerEtSauvegarderCSV(
        formValue.capteurId,
        dateDebut,
        dateFin,
        this.capteurSelectionneRapport.nomCapteur
      ).subscribe({
        next: () => {
          this.snackBar.open(
            `✅ Rapport CSV téléchargé ! (${this.nombreDonneesRapport} données exportées)`,
            'Fermer',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
          this.isGeneratingReport = false;
        },
        error: (error) => {
          console.error('❌ Erreur génération rapport intégré:', error);
          this.snackBar.open(
            '❌ Erreur: ' + error.message,
            'Fermer',
            {
              duration: 7000,
              panelClass: ['error-snackbar']
            }
          );
          this.isGeneratingReport = false;
        }
      });
    } else {
      this.snackBar.open('⚠️ Veuillez remplir tous les champs du rapport', 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  /**
   * Obtenir l'icône du type de capteur pour rapports
   */
  getIconeCapteurRapport(type: string): string {
    switch (type) {
      case 'TEMPERATURE': return 'thermostat';
      case 'HUMIDITE': return 'water_drop';
      case 'POLLUTION': return 'air';
      case 'TRAFIC': return 'traffic';
      case 'BRUIT': return 'volume_up';
      case 'LUMINOSITE': return 'wb_sunny';
      case 'PRESSION': return 'speed';
      case 'VENT': return 'air';
      case 'PLUIE': return 'umbrella';
      default: return 'sensors';
    }
  }

  /**
   * Obtenir la couleur du statut pour rapports
   */
  getCouleurStatutRapport(statut: string): string {
    switch (statut) {
      case 'ACTIF': return '#22c55e';
      case 'INACTIF': return '#6b7280';
      case 'MAINTENANCE': return '#f59e0b';
      case 'DEFAILLANT': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // ========== MÉTHODES EXISTANTES (inchangées) ==========

  genererRapport() {
    if (this.rapportForm.valid) {
      this.isGeneratingReport = true;

      const formData = this.rapportForm.value;
      const dateDebut = this.formatDateForAPI(formData.dateDebut);
      const dateFin = this.formatDateForAPI(formData.dateFin);

      this.donneeIoTService.getDonneesByPeriode(
        formData.capteurId,
        dateDebut,
        dateFin
      ).subscribe({
        next: (response) => {
          this.generateCSVFile(response.donnees, formData.capteurId);
          this.isGeneratingReport = false;

          this.snackBar.open(
            `Rapport généré: ${response.donnees.length} données exportées`,
            'Fermer',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Erreur génération rapport:', error);
          this.isGeneratingReport = false;

          this.snackBar.open(
            'Erreur lors de la génération du rapport',
            'Fermer',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    }
  }

  private generateCSVFile(donnees: DonneeIoTDTO[], capteurId: number) {
    const capteur = this.mesCapteurs.find(c => c.idCapteur === capteurId);
    const csvContent = this.convertToCSV(donnees);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_${capteur?.nomCapteur || 'capteur'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(donnees: DonneeIoTDTO[]): string {
    const headers = [
      'Date/Heure',
      'Température (°C)',
      'Humidité (%)',
      'Qualité Air',
      'PM10 (μg/m³)',
      'CO (mg/m³)',
      'NO2 (μg/m³)',
      'O3 (μg/m³)',
      'Indice UV',
      'Vent (km/h)',
      'Précipitations (mm)',
      'Ville',
      'Capteur'
    ];

    const csvRows = [headers.join(',')];

    donnees.forEach(donnee => {
      const row = [
        `"${new Date(donnee.timestampCollecte).toLocaleString('fr-FR')}"`,
        donnee.temperatureCelsius.toString(),
        donnee.humidite.toString(),
        `"${donnee.qualiteAirResume}"`,
        donnee.pm10.toString(),
        donnee.co.toString(),
        donnee.no2.toString(),
        donnee.o3.toString(),
        donnee.indiceUv.toString(),
        donnee.vitesseVentKph.toString(),
        donnee.precipitationMm.toString(),
        `"${donnee.villeNom}"`,
        `"${donnee.nomCapteur}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().slice(0, 19);
  }

  getStatutColor(statut: string): string {
    return this.capteurService.getStatutColor(statut);
  }

  getDonneesCapteur(capteurId: number): DonneeIoTDTO | null {
    return this.donneesSynthese[capteurId] || null;
  }

  getQualiteAirColor(qualite: string): string {
    return this.donneeIoTService.getQualiteAirColor(qualite);
  }

  getStatistiquesGlobales() {
    const capteursActifs = this.mesCapteurs.filter(c => c.statut === 'ACTIF').length;
    const tempMoyenne = this.calculateAverageTemperature();
    const qualiteAirMoyenne = this.getQualiteAirGlobale();

    return {
      capteursActifs,
      totalCapteurs: this.mesCapteurs.length,
      tempMoyenne,
      qualiteAirMoyenne
    };
  }

  private calculateAverageTemperature(): number {
    const donnees = Object.values(this.donneesSynthese);
    if (donnees.length === 0) return 0;

    const sum = donnees.reduce((acc, donnee) => acc + donnee.temperatureCelsius, 0);
    return Math.round((sum / donnees.length) * 10) / 10;
  }

  private getQualiteAirGlobale(): string {
    const donnees = Object.values(this.donneesSynthese);
    if (donnees.length === 0) return 'N/A';

    const pm10Moyen = donnees.reduce((acc, donnee) => acc + donnee.pm10, 0) / donnees.length;

    if (pm10Moyen <= 20) return 'Bonne';
    if (pm10Moyen <= 40) return 'Moyenne';
    if (pm10Moyen <= 50) return 'Dégradée';
    return 'Mauvaise';
  }

  logout() {
    this.authService.logoutGestionnaire();
    this.router.navigate(['/login/gestionnaire']);
  }

  tousSyCtemesNormaux(): boolean {
    const capteursActifs = this.mesCapteurs.every(capteur => capteur.statut === 'ACTIF');
    const donneesNormales = Object.values(this.donneesSynthese).every(donnee =>
      donnee.temperatureCelsius <= 30 && donnee.pm10 <= 50 && donnee.indiceUv <= 7
    );
    return capteursActifs && donneesNormales && this.mesCapteurs.length > 0;
  }

  hasCapteursInactifs(): boolean {
    return this.mesCapteurs.some(capteur => capteur.statut !== 'ACTIF');
  }

  hasAlertesDecnnees(): boolean {
    return Object.values(this.donneesSynthese).some(donnee =>
      donnee.temperatureCelsius > 30 || donnee.pm10 > 50 || donnee.indiceUv > 7
    );
  }

  getGridCols(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    }
    return 3;
  }
}


