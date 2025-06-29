import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DonneeIoTDTO } from './donnee-io-tservice';

export interface RapportRequest {
  capteurId: number;
  dateDebut: string;
  dateFin: string;
  format: 'CSV' | 'JSON';
  typeRapport?: 'TEMPERATURE' | 'POLLUTION' | 'GLOBAL';
}

export interface RapportResponse {
  donnees: DonneeIoTDTO[];
  totalElements: number;
  capteur_id: number;
  periode_debut: string;
  periode_fin: string;
  metadata?: {
    nomCapteur: string;
    typeCapteur: string;
    nombreDonnees: number;
    tempMoyenne?: number;
    tempMin?: number;
    tempMax?: number;
    qualiteAirMoyenne?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RapportService {
  private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Générer un rapport pour un capteur et une période donnée
   */
  genererRapport(request: RapportRequest): Observable<RapportResponse> {
    return this.http.get<RapportResponse>(
      `${this.API_URL}/capteurs/${request.capteurId}/donnees/periode`,
      {
        params: {
          dateDebut: request.dateDebut,
          dateFin: request.dateFin
        },
        headers: this.getAuthHeaders()
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Exporter les données en CSV
   */
  exporterCSV(donnees: DonneeIoTDTO[], nomCapteur: string): void {
    const csvContent = this.convertToCSV(donnees);
    this.downloadFile(csvContent, `rapport_${nomCapteur}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }

  /**
   * Exporter les données en JSON
   */
  exporterJSON(donnees: DonneeIoTDTO[], nomCapteur: string): void {
    const jsonContent = JSON.stringify(donnees, null, 2);
    this.downloadFile(jsonContent, `rapport_${nomCapteur}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }

  /**
   * Convertir les données en format CSV avec headers français
   */
  private convertToCSV(donnees: DonneeIoTDTO[]): string {
    const headers = [
      'Date et Heure',
      'Capteur',
      'Type de Capteur',
      'Ville',
      'Région',
      'Latitude',
      'Longitude',
      'Température (°C)',
      'Température (°F)',
      'Humidité (%)',
      'Vitesse Vent (km/h)',
      'Précipitations (mm)',
      'Indice UV',
      'Nuageux (%)',
      'CO (mg/m³)',
      'NO2 (μg/m³)',
      'O3 (μg/m³)',
      'SO2 (μg/m³)',
      'PM10 (μg/m³)',
      'Qualité Air',
      'Conditions Météo',
      'Statut Donnée',
      'Source API'
    ];

    const csvRows = [headers.join(';')]; // Utiliser ';' pour Excel français

    donnees.forEach(donnee => {
      const row = [
        `"${new Date(donnee.timestampCollecte).toLocaleString('fr-FR')}"`,
        `"${donnee.nomCapteur}"`,
        `"${donnee.typeCapteur}"`,
        `"${donnee.villeNom}"`,
        `"${donnee.region}"`,
        donnee.latitude.toString().replace('.', ','), // Virgule pour Excel français
        donnee.longitude.toString().replace('.', ','),
        donnee.temperatureCelsius.toString().replace('.', ','),
        donnee.temperatureFahrenheit.toString().replace('.', ','),
        donnee.humidite.toString().replace('.', ','),
        donnee.vitesseVentKph.toString().replace('.', ','),
        donnee.precipitationMm.toString().replace('.', ','),
        donnee.indiceUv.toString().replace('.', ','),
        donnee.nuageux.toString().replace('.', ','),
        donnee.co.toString().replace('.', ','),
        donnee.no2.toString().replace('.', ','),
        donnee.o3.toString().replace('.', ','),
        donnee.so2.toString().replace('.', ','),
        donnee.pm10.toString().replace('.', ','),
        `"${donnee.qualiteAirResume}"`,
        `"${donnee.conditionsMeteo}"`,
        `"${donnee.statutDonnee}"`,
        `"${donnee.sourceApi}"`
      ];
      csvRows.push(row.join(';'));
    });

    // Ajouter BOM UTF-8 pour Excel
    return '\ufeff' + csvRows.join('\n');
  }

  /**
   * Télécharger un fichier
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Générer des statistiques sur les données
   */
  genererStatistiques(donnees: DonneeIoTDTO[]): any {
    if (donnees.length === 0) {
      return null;
    }

    const temperatures = donnees.map(d => d.temperatureCelsius);
    const humidites = donnees.map(d => d.humidite);
    const pm10Values = donnees.map(d => d.pm10);
    const uvValues = donnees.map(d => d.indiceUv);

    return {
      nombreDonnees: donnees.length,
      periode: {
        debut: new Date(Math.min(...donnees.map(d => new Date(d.timestampCollecte).getTime()))),
        fin: new Date(Math.max(...donnees.map(d => new Date(d.timestampCollecte).getTime())))
      },
      temperature: {
        moyenne: this.calculerMoyenne(temperatures),
        min: Math.min(...temperatures),
        max: Math.max(...temperatures)
      },
      humidite: {
        moyenne: this.calculerMoyenne(humidites),
        min: Math.min(...humidites),
        max: Math.max(...humidites)
      },
      pollution: {
        pm10Moyenne: this.calculerMoyenne(pm10Values),
        pm10Max: Math.max(...pm10Values)
      },
      uv: {
        moyenne: this.calculerMoyenne(uvValues),
        max: Math.max(...uvValues)
      },
      qualiteAir: this.analyserQualiteAir(pm10Values)
    };
  }

  private calculerMoyenne(values: number[]): number {
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }

  private analyserQualiteAir(pm10Values: number[]): string {
    const moyenne = this.calculerMoyenne(pm10Values);
    if (moyenne <= 20) return 'Bonne';
    if (moyenne <= 40) return 'Moyenne';
    if (moyenne <= 50) return 'Dégradée';
    return 'Mauvaise';
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
    let errorMessage = 'Une erreur est survenue lors de la génération du rapport';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error || 'Paramètres de rapport invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé - Veuillez vous connecter';
          break;
        case 403:
          errorMessage = 'Accès refusé - Droits insuffisants';
          break;
        case 404:
          errorMessage = 'Capteur ou données non trouvés';
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

    console.error('Erreur RapportService:', error);
    return throwError(() => new Error(errorMessage));
  };
}
