// src/app/services/rapport-gestionnaire.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CapteurDisponible {
  idCapteur: number;
  nomCapteur: string;
  typeCapteur: string;
  statut: string;
  adresse: string;
  gestionnaire: string;
}

export interface CapteurListResponse {
  capteurs: CapteurDisponible[];
  total: number;
}

export interface CountDonneesResponse {
  capteur_id: number;
  nombre_donnees: number;
  periode_debut: string;
  periode_fin: string;
  a_des_donnees: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RapportGestionnaireService {
  private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les capteurs disponibles pour les rapports
   */
  getCapteursDisponibles(): Observable<CapteurListResponse> {
    return this.http.get<CapteurListResponse>(`${this.API_URL}/gestionnaire/capteurs/disponibles`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Compter les données disponibles pour un capteur et une période
   */
  compterDonneesPeriode(idCapteur: number, dateDebut: string, dateFin: string): Observable<CountDonneesResponse> {
    return this.http.get<CountDonneesResponse>(
      `${this.API_URL}/gestionnaire/capteur/${idCapteur}/donnees/count`,
      {
        params: { dateDebut, dateFin },
        headers: this.getAuthHeaders()
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Télécharger le rapport CSV d'un capteur
   */
  telechargerRapportCSV(idCapteur: number, dateDebut: string, dateFin: string): Observable<Blob> {
    return this.http.get(
      `${this.API_URL}/gestionnaire/rapport/capteur/${idCapteur}/csv`,
      {
        params: { dateDebut, dateFin },
        headers: this.getAuthHeaders(),
        responseType: 'blob',
        observe: 'body'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Télécharger et sauvegarder le fichier CSV
   */
  telechargerEtSauvegarderCSV(idCapteur: number, dateDebut: string, dateFin: string, nomCapteur: string): Observable<void> {
    return new Observable(observer => {
      this.telechargerRapportCSV(idCapteur, dateDebut, dateFin).subscribe({
        next: (blob) => {
          this.saveFile(blob, nomCapteur);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Sauvegarder le fichier blob
   */
  private saveFile(blob: Blob, nomCapteur: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const fileName = `rapport_${nomCapteur.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.csv`;

    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyer l'URL
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formater la date pour l'API
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().slice(0, 19);
  }

  /**
   * Valider la période de dates
   */
  validerPeriode(dateDebut: Date, dateFin: Date): string | null {
    if (dateDebut >= dateFin) {
      return 'La date de début doit être antérieure à la date de fin';
    }

    if (dateFin > new Date()) {
      return 'La date de fin ne peut pas être dans le futur';
    }

    // Vérifier que la période n'est pas trop longue (max 1 an)
    const unAn = 365 * 24 * 60 * 60 * 1000; // 1 an en millisecondes
    if (dateFin.getTime() - dateDebut.getTime() > unAn) {
      return 'La période ne peut pas dépasser 1 an';
    }

    return null; // Valide
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
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Paramètres invalides pour le rapport';
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
        case 204:
          errorMessage = 'Aucune donnée trouvée pour cette période';
          break;
        case 500:
          errorMessage = 'Erreur serveur lors de la génération du rapport';
          break;
        case 0:
          errorMessage = 'Impossible de contacter le serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.error || error.message}`;
      }
    }

    console.error('Erreur RapportGestionnaireService:', error);
    return throwError(() => new Error(errorMessage));
  };
}
