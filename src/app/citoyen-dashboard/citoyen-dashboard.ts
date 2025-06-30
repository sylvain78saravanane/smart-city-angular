import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardModule} from '@angular/material/card';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatGridList, MatGridListModule, MatGridTile} from '@angular/material/grid-list';
import {MatProgressBar, MatProgressBarModule} from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../services/auth.service';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import {DonneeIoTDTO, DonneeIoTService} from '../services/donnee-io-tservice';
import {Subscription} from 'rxjs';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {AlertePersonnaliseeService, ResponseAlertePersonnaliseeDTO} from '../services/alerte-personnalisee-service';
import {AlertesPersonnaliseesComponent} from '../alertes-personnalisees-component/alertes-personnalisees-component';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone : true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatProgressBarModule,
    MatCardModule,
    MatGridList,
    MatGridTile,
    MatCard,
    MatCardHeader,
    MatIcon,
    MatCardContent,
    MatCardActions,
    MatProgressBar,
    MatSnackBarModule,
    Footer,
    Header,
    MatButton,
    AlertesPersonnaliseesComponent
  ],
  templateUrl: './citoyen-dashboard.html',
  styleUrl: './citoyen-dashboard.css'
})
export class CitoyenDashboard implements OnInit, OnDestroy {

  currentUser: LoginResponse | null = null;
  donneeEnTempsReel: DonneeIoTDTO | null = null;
  isLoading = true;
  error: string | null = null;
  lastUpdate: Date | null = null;

  alertesPersonnalisees: ResponseAlertePersonnaliseeDTO[] = [];
  showAlertesSection = false;

  private dataSubscription?: Subscription;
  private readonly CAPTEUR_ID = 1; // ID du capteur de Tech City (Paris)
  private readonly REFRESH_INTERVAL = 30000; // 30 secondes

  constructor(
    private authService: AuthService,
    private router: Router,
    private donneeIoTService: DonneeIoTService,
    private snackBar: MatSnackBar,
    private alertePersonnaliseeService: AlertePersonnaliseeService
  ) {}

  ngOnInit() {
    // Récupérer les informations de l'utilisateur connecté
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'CITOYEN') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadAlertesPersonnalisees();

    // Démarrer la récupération des données en temps réel
    this.startRealTimeDataFetching();
  }

  ngOnDestroy() {
    // Nettoyer les subscriptions
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  /**
   * Obtenir l'icône d'une alerte selon son type
   */
  getIconeAlerte(typeAlerte: string): string {
    switch (typeAlerte) {
      case 'QUALITE_AIR':
        return 'air';
      case 'CANICULE':
        return 'thermostat';
      case 'INDICE_UV':
        return 'wb_sunny';
      default:
        return 'notifications';
    }
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

          // Afficher une notification d'erreur
          this.snackBar.open(
            'Erreur lors de la récupération des données IoT',
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

        // Attendre un peu puis récupérer les nouvelles données
        setTimeout(() => {
          this.startRealTimeDataFetching();
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

  getGridCols(): number {
    // Responsive grid
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 2;
    }
    return 2;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
    if (temp < 0) return '#3b82f6'; // Bleu froid
    if (temp < 10) return '#06b6d4'; // Cyan
    if (temp < 20) return '#10b981'; // Vert
    if (temp < 25) return '#f59e0b'; // Orange
    if (temp < 30) return '#f97316'; // Orange foncé
    return '#ef4444'; // Rouge chaud
  }

  /**
   * Obtenir l'icône de la condition météo
   */
  getConditionMeteoIcon(): string {
    if (!this.donneeEnTempsReel) return 'cloud';
    return this.donneeIoTService.getConditionMeteoIcon(this.donneeEnTempsReel.conditionsMeteo);
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
    // Normaliser entre -10 et 40 degrés
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
    // Inverser la logique : plus PM10 est bas, mieux c'est
    // 0-20: Excellent (100%), 20-40: Bon (75%), 40-50: Moyen (50%), 50+: Mauvais (25%)
    if (pm10 <= 20) return 100;
    if (pm10 <= 40) return 75;
    if (pm10 <= 50) return 50;
    return 25;
  }

  goToCommentaires() {
    this.router.navigate(['/dashboard/commentaires']);
  }

  private loadAlertesPersonnalisees() {
    if (!this.currentUser) return;

    this.alertePersonnaliseeService.getAlertesActivesByCitoyen(this.currentUser.idUtilisateur).subscribe({
      next: (response) => {
        this.alertesPersonnalisees = response.alertes;
        console.log('🔔 Alertes personnalisées chargées:', this.alertesPersonnalisees);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des alertes personnalisées:', error);
      }
    });
  }

  goToAlertesPersonnalisees() {
    this.showAlertesSection = !this.showAlertesSection;
  }

  hasAlertesActives(): boolean {
    return this.alertesPersonnalisees.some(alerte => alerte.active);
  }

  getNombreAlertesActives(): number {
    return this.alertesPersonnalisees.filter(alerte => alerte.active).length;
  }

  shouldTriggerAlert(alerte: ResponseAlertePersonnaliseeDTO): boolean {
    if (!this.donneeEnTempsReel || !alerte.active) return false;

    switch (alerte.typeAlerte) {
      case 'QUALITE_AIR':
        return alerte.seuilPM10 !== undefined &&
          this.donneeEnTempsReel.pm10 >= alerte.seuilPM10;
      case 'CANICULE':
        return alerte.seuilTemperature !== undefined &&
          this.donneeEnTempsReel.temperatureCelsius >= alerte.seuilTemperature;
      case 'INDICE_UV':
        return alerte.seuilUV !== undefined &&
          this.donneeEnTempsReel.indiceUv >= alerte.seuilUV;
      default:
        return false;
    }
  }

  getAlertesDeeclenchees(): ResponseAlertePersonnaliseeDTO[] {
    return this.alertesPersonnalisees.filter(alerte => this.shouldTriggerAlert(alerte));
  }

}
