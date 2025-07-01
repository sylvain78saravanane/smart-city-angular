import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatNativeDateModule} from '@angular/material/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule} from '@angular/material/table';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatChipsModule} from '@angular/material/chips';
import {MatDividerModule} from '@angular/material/divider';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../services/auth.service';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import {DonneeIoTDTO, DonneeIoTService} from '../services/donnee-io-tservice';
import {Subscription} from 'rxjs';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-chercheur-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatProgressBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    Header,
    Footer
  ],
  templateUrl: './chercheur-dashboard.html',
  styleUrl: './chercheur-dashboard.css'
})
export class ChercheurDashboard implements OnInit, OnDestroy {

  currentUser: LoginResponse | null = null;
  donneeEnTempsReel: DonneeIoTDTO | null = null;
  donneesHistoriques: DonneeIoTDTO[] = [];
  isLoading = true;
  isExporting = false;
  error: string | null = null;
  lastUpdate: Date | null = null;

  exportForm: FormGroup;
  availableFormats = [
    { value: 'CSV', label: 'CSV - Comma Separated Values' },
    { value: 'JSON', label: 'JSON - JavaScript Object Notation' }
  ];

  private dataSubscription?: Subscription;
  private readonly CAPTEUR_ID = 1; // ID du capteur principal
  private readonly REFRESH_INTERVAL = 30000; // 30 secondes

  // Colonnes pour le tableau des données
  displayedColumns: string[] = [
    'timestampCollecte',
    'villeNom',
    'temperatureCelsius',
    'humidite',
    'pm10',
    'indiceUv',
    'qualiteAirResume'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private donneeIoTService: DonneeIoTService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.exportForm = this.fb.group({
      dateDebut: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), Validators.required], // 7 jours avant
      dateFin: [new Date(), Validators.required],
      format: ['CSV', Validators.required],
      capteurId: [this.CAPTEUR_ID, Validators.required]
    });
  }

  ngOnInit() {
    // Récupérer les informations de l'utilisateur connecté
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'CHERCHEUR') {
      this.router.navigate(['/login/chercheur']);
      return;
    }

    // Démarrer la récupération des données en temps réel
    this.startRealTimeDataFetching();
    this.loadHistoricalData();
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  /**
   * Convertir les dates array en strings pour l'affichage
   */
  private normalizeData(donnees: any[]): DonneeIoTDTO[] {
    return donnees.map(donnee => {
      // Convertir les dates array en string si nécessaire
      if (Array.isArray(donnee.timestampCollecte)) {
        const [year, month, day, hour, minute, second] = donnee.timestampCollecte;
        donnee.timestampCollecte = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second?.toString().padStart(2, '0') || '00'}`;
      }

      if (Array.isArray(donnee.heureLocale)) {
        const [year, month, day, hour, minute] = donnee.heureLocale;
        donnee.heureLocale = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      }

      return donnee as DonneeIoTDTO;
    });
  }

  /**
   * Démarrer la récupération des données en temps réel
   */
  startRealTimeDataFetching() {
    this.isLoading = true;
    this.error = null;

    this.dataSubscription = this.donneeIoTService
      .getDonneesTempsReel(this.CAPTEUR_ID, this.REFRESH_INTERVAL)
      .subscribe({
        next: (response) => {
          if (response.donnees && response.donnees.length > 0) {
            this.donneeEnTempsReel = response.donnees[0];
            this.lastUpdate = new Date();
            this.error = null;
            console.log('📊 Données temps réel mises à jour:', this.donneeEnTempsReel);
          } else {
            this.error = 'Aucune donnée disponible pour le moment';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la récupération des données:', error);
          this.error = error.message;
          this.isLoading = false;

          this.snackBar.open(
            'Erreur lors de la récupération des données IoT',
            'Fermer',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
  }

  /**
   * Charger les données historiques
   */
  loadHistoricalData() {
    if (this.exportForm.invalid) {
      console.warn('Formulaire invalide, impossible de charger les données historiques');
      return;
    }

    const formValue = this.exportForm.value;
    const dateDebut = this.donneeIoTService.formatDateForAPI(formValue.dateDebut);
    const dateFin = this.donneeIoTService.formatDateForAPI(formValue.dateFin);

    console.log('🔍 Chargement des données historiques:', {
      capteur: this.CAPTEUR_ID,
      dateDebut,
      dateFin
    });

    this.donneeIoTService.getDonneesByPeriode(this.CAPTEUR_ID, dateDebut, dateFin).subscribe({
      next: (response) => {
        console.log('📈 Réponse brute du backend:', response);

        // ⭐ NORMALISER les données pour corriger les formats de date
        this.donneesHistoriques = this.normalizeData(response.donnees || []);

        console.log('📈 Données historiques normalisées:', this.donneesHistoriques.length, 'enregistrements');

        if (this.donneesHistoriques.length === 0) {
          this.snackBar.open(
            `Aucune donnée trouvée pour la période du ${dateDebut} au ${dateFin}`,
            'Fermer',
            { duration: 4000, panelClass: ['warning-snackbar'] }
          );
        } else {
          this.snackBar.open(
            `${this.donneesHistoriques.length} données chargées avec succès`,
            'Fermer',
            { duration: 3000, panelClass: ['success-snackbar'] }
          );
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des données historiques:', error);
        this.donneesHistoriques = [];
        this.snackBar.open(
          'Erreur lors du chargement des données historiques: ' + error.message,
          'Fermer',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  /**
   * Rafraîchir manuellement les données
   */
  refreshData() {
    this.isLoading = true;
    this.donneeIoTService.collecterManuellement(this.CAPTEUR_ID).subscribe({
      next: (response) => {
        this.snackBar.open(
          'Collecte de données démarrée',
          'Fermer',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        setTimeout(() => {
          this.startRealTimeDataFetching();
          this.loadHistoricalData();
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la collecte manuelle:', error);
        this.snackBar.open(
          'Erreur lors du rafraîchissement',
          'Fermer',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        this.isLoading = false;
      }
    });
  }

  /**
   * Exporter les données selon les critères sélectionnés
   */
  exportData() {
    if (this.exportForm.invalid) {
      this.snackBar.open(
        'Veuillez remplir tous les champs requis',
        'Fermer',
        { duration: 3000, panelClass: ['warning-snackbar'] }
      );
      return;
    }

    this.isExporting = true;
    const formValue = this.exportForm.value;
    const dateDebut = this.donneeIoTService.formatDateForAPI(formValue.dateDebut);
    const dateFin = this.donneeIoTService.formatDateForAPI(formValue.dateFin);

    // Récupérer les données pour la période sélectionnée
    this.donneeIoTService.getDonneesByPeriode(formValue.capteurId, dateDebut, dateFin).subscribe({
      next: (response) => {
        const donnees = response.donnees || [];

        if (donnees.length === 0) {
          this.snackBar.open(
            'Aucune donnée trouvée pour cette période',
            'Fermer',
            { duration: 3000, panelClass: ['warning-snackbar'] }
          );
          this.isExporting = false;
          return;
        }

        // Générer le fichier selon le format choisi
        if (formValue.format === 'CSV') {
          this.exportToCSV(donnees, dateDebut, dateFin);
        } else if (formValue.format === 'JSON') {
          this.exportToJSON(donnees, dateDebut, dateFin);
        }

        this.snackBar.open(
          `Export ${formValue.format} réussi ! ${donnees.length} données exportées`,
          'Fermer',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );

        this.isExporting = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'export:', error);
        this.snackBar.open(
          'Erreur lors de l\'exportation des données',
          'Fermer',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        this.isExporting = false;
      }
    });
  }

  /**
   * Exporter au format CSV
   */
  private exportToCSV(donnees: DonneeIoTDTO[], dateDebut: string, dateFin: string) {
    const headers = [
      'ID_Donnee',
      'Date_Collecte',
      'Ville',
      'Region',
      'Pays',
      'Latitude',
      'Longitude',
      'Temperature_Celsius',
      'Temperature_Fahrenheit',
      'Humidite',
      'Vitesse_Vent_KPH',
      'Precipitation_MM',
      'CO',
      'NO2',
      'O3',
      'SO2',
      'PM10',
      'Indice_UV',
      'Nuageux',
      'Qualite_Air',
      'Conditions_Meteo',
      'Source_API',
      'ID_Capteur',
      'Nom_Capteur'
    ];

    let csvContent = headers.join(',') + '\n';

    donnees.forEach(donnee => {
      const row = [
        donnee.idDonneeIoT,
        `"${donnee.timestampCollecte}"`,
        `"${this.escapeCsv(donnee.villeNom)}"`,
        `"${this.escapeCsv(donnee.region)}"`,
        `"${this.escapeCsv(donnee.pays)}"`,
        donnee.latitude,
        donnee.longitude,
        donnee.temperatureCelsius,
        donnee.temperatureFahrenheit,
        donnee.humidite,
        donnee.vitesseVentKph,
        donnee.precipitationMm,
        donnee.co,
        donnee.no2,
        donnee.o3,
        donnee.so2,
        donnee.pm10,
        donnee.indiceUv,
        donnee.nuageux,
        `"${this.escapeCsv(donnee.qualiteAirResume)}"`,
        `"${this.escapeCsv(donnee.conditionsMeteo)}"`,
        `"${this.escapeCsv(donnee.sourceApi)}"`,
        donnee.idCapteur,
        `"${this.escapeCsv(donnee.nomCapteur)}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    this.downloadFile(
      csvContent,
      `donnees_iot_${dateDebut}_${dateFin}.csv`,
      'text/csv'
    );
  }

  /**
   * Exporter au format JSON
   */
  private exportToJSON(donnees: DonneeIoTDTO[], dateDebut: string, dateFin: string) {
    const exportData = {
      metadata: {
        export_date: new Date().toISOString(),
        periode_debut: dateDebut,
        periode_fin: dateFin,
        nombre_donnees: donnees.length,
        chercheur: this.currentUser?.nomComplet,
        institut: this.currentUser?.donneesSpecifiques?.institut || 'Non spécifié'
      },
      donnees: donnees.map(donnee => ({
        id: donnee.idDonneeIoT,
        timestamp: donnee.timestampCollecte,
        localisation: {
          ville: donnee.villeNom,
          region: donnee.region,
          pays: donnee.pays,
          latitude: donnee.latitude,
          longitude: donnee.longitude
        },
        meteo: {
          temperature_celsius: donnee.temperatureCelsius,
          temperature_fahrenheit: donnee.temperatureFahrenheit,
          humidite: donnee.humidite,
          vitesse_vent_kph: donnee.vitesseVentKph,
          precipitation_mm: donnee.precipitationMm,
          nuageux: donnee.nuageux,
          indice_uv: donnee.indiceUv,
          conditions: donnee.conditionsMeteo
        },
        pollution: {
          co: donnee.co,
          no2: donnee.no2,
          o3: donnee.o3,
          so2: donnee.so2,
          pm10: donnee.pm10,
          qualite_air_resume: donnee.qualiteAirResume
        },
        capteur: {
          id: donnee.idCapteur,
          nom: donnee.nomCapteur,
          type: donnee.typeCapteur
        },
        source: {
          api: donnee.sourceApi,
          statut: donnee.statutDonnee,
          valide: donnee.donneeValide
        }
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    this.downloadFile(
      jsonContent,
      `donnees_iot_${dateDebut}_${dateFin}.json`,
      'application/json'
    );
  }

  /**
   * Télécharger un fichier
   */
  private downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Échapper les virgules et guillemets pour CSV
   */
  private escapeCsv(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/"/g, '""');
  }

  /**
   * Obtenir la couleur de la qualité de l'air
   */
  getQualiteAirColor(): string {
    if (!this.donneeEnTempsReel) return 'gray';
    return this.donneeIoTService.getQualiteAirColor(this.donneeEnTempsReel.qualiteAirResume);
  }

  /**
   * Obtenir la couleur de la température
   */
  getTemperatureColor(): string {
    if (!this.donneeEnTempsReel) return 'gray';
    const temp = this.donneeEnTempsReel.temperatureCelsius;
    if (temp < 0) return '#3b82f6';
    if (temp < 10) return '#06b6d4';
    if (temp < 20) return '#10b981';
    if (temp < 25) return '#f59e0b';
    if (temp < 30) return '#f97316';
    return '#ef4444';
  }

  /**
   * Obtenir la couleur UV
   */
  getUVColor(): string {
    if (!this.donneeEnTempsReel) return 'gray';
    return this.donneeIoTService.getUVColor(this.donneeEnTempsReel.indiceUv);
  }

  /**
   * Obtenir le niveau UV
   */
  getUVLevel(): string {
    if (!this.donneeEnTempsReel) return 'N/A';
    return this.donneeIoTService.getUVLevel(this.donneeEnTempsReel.indiceUv);
  }

  /**
   * Formater la dernière mise à jour
   */
  getLastUpdateString(): string {
    if (!this.lastUpdate) return 'Jamais';
    const now = new Date();
    const diffMs = now.getTime() - this.lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `Il y a ${diffSeconds} seconde${diffSeconds > 1 ? 's' : ''}`;
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return this.lastUpdate.toLocaleTimeString('fr-FR');
    }
  }

  getGridCols(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 2;
    }
    return 2;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login/chercheur']);
  }

  /**
   * Obtenir la progression de l'humidité (0-100%)
   */
  getHumiditeProgress(): number {
    return this.donneeEnTempsReel ? this.donneeEnTempsReel.humidite : 0;
  }

  /**
   * Obtenir la progression de la température (-10°C à 40°C)
   */
  getTemperatureProgress(): number {
    if (!this.donneeEnTempsReel) return 0;
    const temp = this.donneeEnTempsReel.temperatureCelsius;
    return Math.max(0, Math.min(100, ((temp + 10) / 50) * 100));
  }

  /**
   * Obtenir la progression UV (0-12)
   */
  getUVProgress(): number {
    if (!this.donneeEnTempsReel) return 0;
    return Math.max(0, Math.min(100, (this.donneeEnTempsReel.indiceUv / 12) * 100));
  }

  /**
   * Obtenir la progression de la qualité de l'air basée sur PM10
   */
  getQualiteAirProgress(): number {
    if (!this.donneeEnTempsReel) return 0;
    const pm10 = this.donneeEnTempsReel.pm10;
    if (pm10 <= 20) return 100;
    if (pm10 <= 40) return 75;
    if (pm10 <= 50) return 50;
    return 25;
  }

  /**
   * Formater une date pour l'affichage
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  /**
   * Actualiser les données historiques selon le formulaire
   */
  updateHistoricalData() {
    if (this.exportForm.valid) {
      this.loadHistoricalData();
    }
  }
}
