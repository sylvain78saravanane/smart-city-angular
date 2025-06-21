import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface LoginResponse {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  dateNaissance: string;
  telephone: string;
  numeroRue: string;
  adresse: string;
  codePostal: string;
  actif: boolean;
  notificationActive: boolean;
  role: string;
  typeUtilisateur: string;
  donneesSpecifiques: {
    latitude?: number;
    longitude?: number;
    type: string;
  };
  nombrePermissions: number;
}
export interface ResponseUtilisateurDTO {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  typeUtilisateur: string;
  actif: boolean;
}

export interface CreateUtilisateurDTO {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  dateNaissance?: string;
  telephone?: string;
  numeroRue?: string;
  adresse?: string;
  codePostal?: string;
  typeUtilisateur: 'CITOYEN';
  donneesSpecifiques: {
    latitude?: number;
    longitude?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/v1';
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(user => {
          this.setCurrentUser(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Création d'un nouveau citoyen
   */
  register(userData: CreateUtilisateurDTO): Observable<ResponseUtilisateurDTO> {
    return this.http.post<ResponseUtilisateurDTO>(`${this.API_URL}/utilisateurs`, userData)
      .pipe(
        catchError(error => {
          console.error('Erreur d\'inscription :',error);
          throw error;
        })
      );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  /**
   * Vérifier si l'utilisateur est un citoyen
   */
  isCitoyen(): boolean {
    return this.hasRole('CITOYEN');
  }

  /**
   * Obtenir les informations d'un utilisateur par ID
   */
  getUserById(id: number): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.API_URL}/utilisateurs/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Définir l'utilisateur actuel et le sauvegarder
   */
  private setCurrentUser(user: LoginResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Charger l'utilisateur depuis le localStorage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user: LoginResponse = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 403:
          errorMessage = 'Accès refusé - Compte désactivé';
          break;
        case 404:
          errorMessage = 'Utilisateur non trouvé';
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

    console.error('Erreur AuthService:', error);
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Fonction utilitaire pour formater les données d'inscription
   */
  static formatRegisterData(formData: any): CreateUtilisateurDTO {
    return {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      motDePasse: formData.motDePasse,
      dateNaissance: formData.dateNaissance,
      telephone: formData.telephone,
      numeroRue: formData.numeroRue,
      adresse: formData.adresse,
      codePostal: formData.codePostal,
      typeUtilisateur: 'CITOYEN',
      donneesSpecifiques: {
        latitude: formData.latitude,
        longitude: formData.longitude
      }
    };
  }

}
