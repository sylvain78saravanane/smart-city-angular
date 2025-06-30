// src/app/services/alerte-personnalisee.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CreateAlertePersonnaliseeDTO {
  nomAlerte: string;
  description?: string;
  typeAlerte: 'QUALITE_AIR' | 'CANICULE' | 'INDICE_UV';
  active?: boolean;
  seuilPM10?: number;
  seuilTemperature?: number;
  seuilUV?: number;
  frequenceNotification?: 'IMMEDIATE' | 'QUOTIDIEN' | 'HEBDOMADAIRE';
  heureNotification?: string;
  joursActifs?: string;
  secteurSurveillance?: string;
  latitudeCentre?: number;
  longitudeCentre?: number;
  rayonKm?: number;
  idCitoyen: number;
}

export interface UpdateAlertePersonnaliseeDTO {
  nomAlerte?: string;
  description?: string;
  active?: boolean;
  seuilPM10?: number;
  seuilTemperature?: number;
  seuilUV?: number;
  frequenceNotification?: 'IMMEDIATE' | 'QUOTIDIEN' | 'HEBDOMADAIRE';
  heureNotification?: string;
  joursActifs?: string;
  secteurSurveillance?: string;
  rayonKm?: number;
}

export interface ResponseAlertePersonnaliseeDTO {
  idAlertePersonnalisee: number;
  nomAlerte: string;
  description?: string;
  typeAlerte: string;
  typeAlerteFormate: string;
  active: boolean;
  seuilPM10?: number;
  seuilTemperature?: number;
  seuilUV?: number;
  seuilFormate: string;
  frequenceNotification: string;
  heureNotification?: string;
  joursActifs: string;
  secteurSurveillance?: string;
  latitudeCentre?: number;
  longitudeCentre?: number;
  rayonKm: number;
  derniereNotification?: string;
  nombreNotificationsEnvoyees: number;
  dateCreation: string;
  dateModification?: string;
  idCitoyen: number;
  nomCompletCitoyen: string;
  emailCitoyen: string;
  peutNotifier: boolean;
  prochaineDateNotification?: string;
}

export interface TypeAlerteInfo {
  code: string;
  nom: string;
  description: string;
  unite: string;
  seuilMin: number;
  seuilMax: number;
  seuilRecommande: number;
}

export interface FrequenceInfo {
  code: string;
  nom: string;
}

export interface TypesAlertesResponse {
  types: TypeAlerteInfo[];
  frequences: FrequenceInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class AlertePersonnaliseeService {
  private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les headers d'authentification JWT
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Créer une nouvelle alerte personnalisée
   */
  createAlertePersonnalisee(alerte: CreateAlertePersonnaliseeDTO): Observable<ResponseAlertePersonnaliseeDTO> {
    return this.http.post<ResponseAlertePersonnaliseeDTO>(
      `${this.API_URL}/alertes-personnalisees`,
      alerte,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir une alerte personnalisée par ID
   */
  getAlertePersonnaliseeById(id: number): Observable<ResponseAlertePersonnaliseeDTO> {
    return this.http.get<ResponseAlertePersonnaliseeDTO>(
      `${this.API_URL}/alertes-personnalisees/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir toutes les alertes d'un citoyen
   */
  getAlertesPersonnaliseesByCitoyen(idCitoyen: number): Observable<{alertes: ResponseAlertePersonnaliseeDTO[], total: number}> {
    return this.http.get<{alertes: ResponseAlertePersonnaliseeDTO[], total: number}>(
      `${this.API_URL}/citoyens/${idCitoyen}/alertes-personnalisees`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les alertes actives d'un citoyen
   */
  getAlertesActivesByCitoyen(idCitoyen: number): Observable<{alertes: ResponseAlertePersonnaliseeDTO[], total: number}> {
    return this.http.get<{alertes: ResponseAlertePersonnaliseeDTO[], total: number}>(
      `${this.API_URL}/citoyens/${idCitoyen}/alertes-personnalisees/actives`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour une alerte personnalisée
   */
  updateAlertePersonnalisee(id: number, alerte: UpdateAlertePersonnaliseeDTO): Observable<ResponseAlertePersonnaliseeDTO> {
    return this.http.put<ResponseAlertePersonnaliseeDTO>(
      `${this.API_URL}/alertes-personnalisees/${id}`,
      alerte,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Supprimer une alerte personnalisée
   */
  deleteAlertePersonnalisee(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(
      `${this.API_URL}/alertes-personnalisees/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Activer une alerte personnalisée
   */
  activerAlertePersonnalisee(id: number): Observable<{message: string}> {
    return this.http.patch<{message: string}>(
      `${this.API_URL}/alertes-personnalisees/${id}/activer`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Désactiver une alerte personnalisée
   */
  desactiverAlertePersonnalisee(id: number): Observable<{message: string}> {
    return this.http.patch<{message: string}>(
      `${this.API_URL}/alertes-personnalisees/${id}/desactiver`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les types d'alertes disponibles
   */
  getTypesAlertes(): Observable<TypesAlertesResponse> {
    return this.http.get<TypesAlertesResponse>(
      `${this.API_URL}/alertes-personnalisees/types`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Méthodes utilitaires
   */

  getIconeTypeAlerte(typeAlerte: string): string {
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

  getCouleurTypeAlerte(typeAlerte: string): string {
    switch (typeAlerte) {
      case 'QUALITE_AIR':
        return '#ff9800'; // Orange
      case 'CANICULE':
        return '#f44336'; // Rouge
      case 'INDICE_UV':
        return '#ffc107'; // Jaune
      default:
        return '#2196f3'; // Bleu
    }
  }

  getDescriptionFrequence(frequence: string): string {
    switch (frequence) {
      case 'IMMEDIATE':
        return 'Notification immédiate dès que le seuil est dépassé';
      case 'QUOTIDIEN':
        return 'Une notification par jour maximum';
      case 'HEBDOMADAIRE':
        return 'Une notification par semaine maximum';
      default:
        return 'Fréquence non définie';
    }
  }

  /**
   * Validation des seuils selon le type d'alerte
   */
  isSeuilValide(typeAlerte: string, seuil: number): boolean {
    switch (typeAlerte) {
      case 'QUALITE_AIR':
        return seuil >= 0 && seuil <= 500;
      case 'CANICULE':
        return seuil >= 15 && seuil <= 50;
      case 'INDICE_UV':
        return seuil >= 1 && seuil <= 15;
      default:
        return false;
    }
  }

  /**
   * Obtenir le seuil recommandé selon le type
   */
  getSeuilRecommande(typeAlerte: string): number {
    switch (typeAlerte) {
      case 'QUALITE_AIR':
        return 50; // Seuil OMS pour PM10
      case 'CANICULE':
        return 30; // 30°C
      case 'INDICE_UV':
        return 8; // Indice UV élevé
      default:
        return 0;
    }
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé - Veuillez vous reconnecter';
          break;
        case 403:
          errorMessage = 'Accès refusé - Permissions insuffisantes';
          break;
        case 404:
          errorMessage = 'Alerte non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur - Veuillez réessayer plus tard';
          break;
        case 0:
          errorMessage = 'Impossible de contacter le serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.error || error.message}`;
      }
    }

    console.error('Erreur AlertePersonnaliseeService:', error);
    return throwError(() => new Error(errorMessage));
  };
}
