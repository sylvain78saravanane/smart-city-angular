import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {interval, Observable, startWith, switchMap, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

export interface DonneeIoTDTO {
  idDonneeIoT: number;
  idCapteur: number;
  nomCapteur: string;
  typeCapteur: string;
  villeNom: string;
  region: string;
  pays: string;
  latitude: number;
  longitude: number;
  localisation: string;
  coordonnees: string;
  heureLocale: string;
  temperatureCelsius: number;
  temperatureFahrenheit: number;
  vitesseVentKph: number;
  precipitationMm: number;
  humidite: number;
  nuageux: number;
  indiceUv: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm10: number;
  timestampCollecte: string;
  statutDonnee: string;
  sourceApi: string;
  donneeValide: boolean;
  qualiteAirResume: string;
  conditionsMeteo: string;
}

export interface DonneeListResponse {
  donnees: DonneeIoTDTO[];
  total: number;
  capteur_id?: number;
  limite?: number;
}

export interface StatistiquesResponse {
  capteur_id: number;
  periode_debut: string;
  periode_fin: string;
  temperature_moyenne: number;
  temperature_maximum: number;
  temperature_minimum: number;
}

export interface StatistiquesAirResponse {
  capteur_id: number;
  periode_debut: string;
  periode_fin: string;
  co_moyenne: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonneeIoTService {
  private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les dernières données d'un capteur
   */
  getLatestDonneesByCapteur(idCapteur: number, limite: number = 1): Observable<DonneeListResponse> {
    return this.http.get<DonneeListResponse>(`${this.API_URL}/capteurs/${idCapteur}/donnees/latest?limite=${limite}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les données en temps réel (avec rafraîchissement automatique)
   */
  getDonneesTempsReel(idCapteur: number, intervalMs: number = 30000): Observable<DonneeListResponse> {
    return interval(intervalMs).pipe(
      startWith(0), // Démarrer immédiatement
      switchMap(() => this.getLatestDonneesByCapteur(idCapteur, 1))
    );
  }

  /**
   * Obtenir les données par période
   */
  getDonneesByPeriode(idCapteur: number, dateDebut: string, dateFin: string): Observable<DonneeListResponse> {
    // Encoder les paramètres URL pour éviter les problèmes de caractères spéciaux
    const params = new URLSearchParams({
      dateDebut: dateDebut,
      dateFin: dateFin
    });

    return this.http.get<DonneeListResponse>(
      `${this.API_URL}/capteurs/${idCapteur}/donnees/periode?${params.toString()}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }


  /**
   * Déclencher une collecte manuelle
   */
  collecterManuellement(idCapteur: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/capteurs/${idCapteur}/collecter`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }


  /**
   * Obtenir le nombre de données d'un capteur
   */
  getCountDonneesByCapteur(idCapteur: number): Observable<{ capteur_id: number; nombre_donnees: number }> {
    return this.http.get<{ capteur_id: number; nombre_donnees: number }>(
      `${this.API_URL}/capteurs/${idCapteur}/statistiques/count`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les headers d'authentification
   */
  private getAuthHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue lors de la récupération des données';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error || 'Paramètres invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé - Veuillez vous connecter';
          break;
        case 403:
          errorMessage = 'Accès refusé';
          break;
        case 404:
          errorMessage = 'Données non trouvées';
          break;
        case 500:
          errorMessage = 'Erreur serveur - Les données IoT ne sont pas disponibles';
          break;
        case 0:
          errorMessage = 'Impossible de contacter le serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.error || error.message}`;
      }
    }

    console.error('Erreur DonneeIoTService:', error);
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Formater la date pour les appels API
   */
  formatDateForAPI(date: Date): string {
    const isoString = date.toISOString();
    return date.toISOString().slice(0, 19); // Format: 2025-06-28T10:30:00
  }

  /**
   * Obtenir la couleur de la qualité de l'air
   */
  getQualiteAirColor(qualite: string): string {
    switch (qualite?.toLowerCase()) {
      case 'bonne': return '#22c55e';
      case 'moyenne': return '#f59e0b';
      case 'dégradée': return '#f97316';
      case 'mauvaise': return '#ef4444';
      case 'très mauvaise': return '#991b1b';
      default: return '#6b7280';
    }
  }

  /**
   * Obtenir l'icône de la condition météo
   */
  getConditionMeteoIcon(condition: string): string {
    if (condition?.toLowerCase().includes('froid')) return 'ac_unit';
    if (condition?.toLowerCase().includes('chaud')) return 'wb_sunny';
    if (condition?.toLowerCase().includes('pluie') || condition?.toLowerCase().includes('précipitation')) return 'water_drop';
    if (condition?.toLowerCase().includes('vent')) return 'air';
    if (condition?.toLowerCase().includes('agréable')) return 'wb_sunny';
    return 'thermostat';
  }

  /**
   * Formater la température
   */
  formatTemperature(celsius: number): string {
    return `${Math.round(celsius)}°C`;
  }

  /**
   * Formater l'humidité
   */
  formatHumidite(humidite: number): string {
    return `${Math.round(humidite)}%`;
  }

  /**
   * Formater l'indice UV
   */
  formatIndiceUV(uv: number): string {
    return Math.round(uv).toString();
  }

  /**
   * Obtenir le niveau d'indice UV
   */
  getUVLevel(uv: number): string {
    if (uv <= 2) return 'Faible';
    if (uv <= 5) return 'Modéré';
    if (uv <= 7) return 'Élevé';
    if (uv <= 10) return 'Très élevé';
    return 'Extrême';
  }

  /**
   * Obtenir la couleur de l'indice UV
   */
  getUVColor(uv: number): string {
    if (uv <= 2) return '#22c55e';
    if (uv <= 5) return '#eab308';
    if (uv <= 7) return '#f97316';
    if (uv <= 10) return '#ef4444';
    return '#991b1b';
  }
}
