import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';

export interface CreateCommentaireDTO {
  titre?: string;
  contenu: string;
  noteEvaluation?: number;
  sujet?: string;
  localisation?: string;
  idCitoyen: number;
}

export interface ResponseCommentaireDTO {
  idCommentaire: number;
  titre?: string;
  contenu: string;
  resume: string;
  dateCreation: string;
  dateModification?: string;
  actif: boolean;
  noteEvaluation?: number;
  nombreLikes: number;
  nombreDislikes: number;
  totalInteractions: number;
  sujet?: string;
  localisation?: string;

  // Informations du citoyen
  idCitoyen: number;
  nomCompletCitoyen: string;
  emailCitoyen: string;

  // Méta-données
  peutModifier: boolean;
  peutSupprimer: boolean;
  joursDepuisCreation: number;
}

export interface CommentairesResponse {
  commentaires: ResponseCommentaireDTO[];
  total: number;
  sujet?: string;
  terme_recherche?: string;
  limite?: number;
  periode_jours?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommentaireService {
  private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Créer un nouveau commentaire
   */
  createCommentaire(commentaire: CreateCommentaireDTO): Observable<ResponseCommentaireDTO> {
    return this.http.post<ResponseCommentaireDTO>(
      `${this.API_URL}/commentaires`,
      commentaire,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Récupérer tous les commentaires par sujet
   */
  getCommentairesBySujet(sujet: string): Observable<CommentairesResponse> {
    return this.http.get<CommentairesResponse>(
      `${this.API_URL}/commentaires/sujet/${sujet}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Récupérer les commentaires populaires
   */
  getCommentairesPopulaires(limite: number = 10): Observable<CommentairesResponse> {
    return this.http.get<CommentairesResponse>(
      `${this.API_URL}/commentaires/populaires?limite=${limite}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Récupérer les commentaires récents
   */
  getCommentairesRecents(jours: number = 7): Observable<CommentairesResponse> {
    return this.http.get<CommentairesResponse>(
      `${this.API_URL}/commentaires/recents?jours=${jours}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Rechercher des commentaires
   */
  rechercherCommentaires(terme: string): Observable<CommentairesResponse> {
    return this.http.get<CommentairesResponse>(
      `${this.API_URL}/commentaires/recherche?q=${encodeURIComponent(terme)}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Ajouter un like à un commentaire
   */
  ajouterLike(idCommentaire: number): Observable<any> {
    return this.http.post(
      `${this.API_URL}/commentaires/${idCommentaire}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Retirer un like d'un commentaire
   */
  retirerLike(idCommentaire: number): Observable<any> {
    return this.http.delete(
      `${this.API_URL}/commentaires/${idCommentaire}/like`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Ajouter un dislike à un commentaire
   */
  ajouterDislike(idCommentaire: number): Observable<any> {
    return this.http.post(
      `${this.API_URL}/commentaires/${idCommentaire}/dislike`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Retirer un dislike d'un commentaire
   */
  retirerDislike(idCommentaire: number): Observable<any> {
    return this.http.delete(
      `${this.API_URL}/commentaires/${idCommentaire}/dislike`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Récupérer un commentaire par ID
   */
  getCommentaireById(id: number): Observable<ResponseCommentaireDTO> {
    return this.http.get<ResponseCommentaireDTO>(
      `${this.API_URL}/commentaires/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
