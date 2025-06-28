// src/app/services/capteur.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';

export interface CreateCapteurDTO {
  nomCapteur: string;
  typeCapteur: 'TEMPERATURE' | 'HUMIDITE' | 'POLLUTION' | 'TRAFIC' | 'BRUIT' | 'LUMINOSITE' | 'PRESSION' | 'VENT' | 'PLUIE';
  description?: string;
  latitude?: number;
  longitude?: number;
  adresseInstallation?: string;
  statut?: 'ACTIF' | 'INACTIF' | 'MAINTENANCE' | 'DEFAILLANT';
  dateInstallation?: string;
  frequenceMesure?: number;
  uniteMesure?: string;
  valeurMin?: number;
  valeurMax?: number;
  numeroSerie?: string;
  modele?: string;
  fabricant?: string;
  idGestionnaireResponsable: number;
  typeGestionnaire: 'ADMINISTRATEUR' | 'GESTIONNAIRE_VILLE';
}

export interface UpdateCapteurDTO extends Partial<CreateCapteurDTO> {
  idCapteur: number;
}

export interface ResponseCapteurDTO {
  idCapteur: number;
  nomCapteur: string;
  typeCapteur: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  adresseInstallation?: string;
  statut: string;
  dateInstallation?: string;
  dateDerniereMaintenance?: string;
  frequenceMesure?: number;
  uniteMesure?: string;
  valeurMin?: number;
  valeurMax?: number;
  numeroSerie?: string;
  modele?: string;
  fabricant?: string;
  dateCreation?: string;
  dateModification?: string;
  idGestionnaireResponsable?: number;
  nomGestionnaireResponsable?: string;
  typeGestionnaire?: string;
  emailGestionnaire?: string;
  actif: boolean;
  joursDepuisInstallation?: number;
  coordonneesGPS?: string;
}

export interface CapteurListResponse {
  capteurs: ResponseCapteurDTO[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CapteurService {
  private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau capteur
   */
  createCapteur(capteurData: CreateCapteurDTO): Observable<ResponseCapteurDTO> {
    console.log('🔄 Création capteur avec données:', capteurData);
    console.log('🔑 Headers utilisés:', this.getAuthHeaders());

    return this.http.post<ResponseCapteurDTO>(`${this.API_URL}/capteurs`, capteurData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir tous les capteurs
   */
  getAllCapteurs(): Observable<CapteurListResponse> {
    return this.http.get<CapteurListResponse>(`${this.API_URL}/capteurs`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir un capteur par ID
   */
  getCapteurById(id: number): Observable<ResponseCapteurDTO> {
    return this.http.get<ResponseCapteurDTO>(`${this.API_URL}/capteurs/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les capteurs d'un gestionnaire
   */
  getCapteursByGestionnaire(idGestionnaire: number): Observable<CapteurListResponse> {
    return this.http.get<CapteurListResponse>(`${this.API_URL}/gestionnaires/${idGestionnaire}/capteurs`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Supprimer un capteur
   */
  deleteCapteur(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/capteurs/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour un capteur (si l'endpoint existe)
   */
  updateCapteur(capteurData: UpdateCapteurDTO): Observable<ResponseCapteurDTO> {
    return this.http.put<ResponseCapteurDTO>(`${this.API_URL}/capteurs/${capteurData.idCapteur}`, capteurData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Déclencher une collecte manuelle pour un capteur
   */
  collecterDonneesManuellement(idCapteur: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/capteurs/${idCapteur}/collecter`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les headers d'authentification
   */
  private getAuthHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('authToken');
    console.log('Token récupéré:', token); // Debug

    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } else {
      console.warn('Aucun token trouvé dans localStorage');
      return {
        'Content-Type': 'application/json'
      };
    }
  }

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
          errorMessage = 'Non autorisé - Veuillez vous connecter';
          break;
        case 403:
          errorMessage = 'Accès refusé - Droits insuffisants';
          break;
        case 404:
          errorMessage = 'Capteur non trouvé';
          break;
        case 409:
          errorMessage = 'Conflit - Un capteur avec ce numéro de série existe déjà';
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

    console.error('Erreur CapteurService:', error);
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Obtenir les types de capteurs disponibles
   */
  getTypesCapteurs(): string[] {
    return [
      'TEMPERATURE',
      'HUMIDITE',
      'POLLUTION',
      'TRAFIC',
      'BRUIT',
      'LUMINOSITE',
      'PRESSION',
      'VENT',
      'PLUIE'
    ];
  }

  /**
   * Obtenir les statuts disponibles
   */
  getStatutsCapteurs(): string[] {
    return [
      'ACTIF',
      'INACTIF',
      'MAINTENANCE',
      'DEFAILLANT'
    ];
  }

  /**
   * Valider les coordonnées GPS
   */
  validateCoordinates(latitude?: number, longitude?: number): boolean {
    if (latitude === undefined || longitude === undefined) {
      return true; // Coordonnées optionnelles
    }

    return latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180;
  }

  /**
   * Formater l'adresse d'affichage
   */
  formatAdresseAffichage(capteur: ResponseCapteurDTO): string {
    if (capteur.coordonneesGPS) {
      return capteur.adresseInstallation ?
        `${capteur.adresseInstallation} (${capteur.coordonneesGPS})` :
        capteur.coordonneesGPS;
    }
    return capteur.adresseInstallation || 'Adresse non renseignée';
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatutColor(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'green';
      case 'INACTIF': return 'gray';
      case 'MAINTENANCE': return 'orange';
      case 'DEFAILLANT': return 'red';
      default: return 'gray';
    }
  }

  /**
   * Obtenir l'icône du type de capteur
   */
  getTypeCapteurIcon(type: string): string {
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
}
