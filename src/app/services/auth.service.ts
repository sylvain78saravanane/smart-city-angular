// src/app/services/auth.service.ts - Version corrigée

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface AdminLoginRequest extends LoginRequest {
  code_admin: string;
}

// Interface correspondant à la réponse du back-end pour /login
export interface LoginTokenResponse {
  token: string;
  type: string;
  utilisateur: LoginResponse;
  expiresIn: number;
}

// Interface pour les données utilisateur du back-end
export interface DonneesSpecifiques {
  latitude?: number;
  longitude?: number;
  codeAdmin?: string;
  salaire?: number;
  codeGV?: string;
  nomDepartement?: string;
  institut?: string;
  domaineRecherche?: string;
  type: string;
}

export interface LoginResponse {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  dateNaissance?: string;
  telephone?: string;
  numeroRue?: string;
  adresse?: string;
  codePostal?: string;
  actif: boolean;
  notificationActive?: boolean;
  role: string;
  typeUtilisateur: string;
  donneesSpecifiques: DonneesSpecifiques;
  nombrePermissions?: number;
}

export interface AdminLoginResponse extends LoginResponse {
  donneesSpecifiques: DonneesSpecifiques & {
    codeAdmin: string;
    salaire: number;
    type: 'ADMINISTRATEUR';
  };
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
   * Connexion utilisateur normale
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginTokenResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        map(response => {
          // Stocker le token
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
          return response.utilisateur;
        }),
        tap(user => {
          this.setCurrentUser(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Connexion administrateur avec code admin
   */
  loginAdmin(credentials: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http.post<ResponseUtilisateurDTO>(`${this.API_URL}/admin/login`, credentials)
      .pipe(
        map(user => {
          // Adapter la réponse du back-end au format attendu
          const adminUser: AdminLoginResponse = {
            idUtilisateur: user.idUtilisateur,
            nom: user.nom,
            prenom: user.prenom,
            nomComplet: user.nomComplet || `${user.prenom} ${user.nom}`,
            email: user.email,
            actif: user.actif,
            role: 'ADMINISTRATEUR',
            typeUtilisateur: user.typeUtilisateur,
            donneesSpecifiques: {
              codeAdmin: credentials.code_admin, // On utilise le code envoyé
              salaire: 0, // À adapter selon votre back-end
              type: 'ADMINISTRATEUR'
            }
          };
          return adminUser;
        }),
        tap(user => {
          this.setCurrentUser(user);
          localStorage.setItem('isAdmin', 'true');
        }),
        catchError(this.handleAdminError)
      );
  }

  /**
   * Création d'un nouveau citoyen
   */
  register(userData: CreateUtilisateurDTO): Observable<ResponseUtilisateurDTO> {
    return this.http.post<ResponseUtilisateurDTO>(`${this.API_URL}/utilisateurs`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAdmin');
    this.currentUserSubject.next(null);
  }

  /**
   * Déconnexion administrateur spécifique
   */
  logoutAdmin(): void {
    localStorage.removeItem('isAdmin');
    this.logout();
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
   * Vérifier si l'utilisateur est un administrateur
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
    return user ? (user.role === 'ADMINISTRATEUR' && isAdminFlag) : false;
  }

  /**
   * Obtenir les informations d'un utilisateur par ID
   */
  getUserById(id: number): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.API_URL}/utilisateurs/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Obtenir les headers d'authentification
   */
  private getAuthHeaders(): { [key: string]: string } {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
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
   * Gestion des erreurs HTTP normales
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
   * Gestion d'erreur spécifique pour l'authentification admin
   */
  private handleAdminError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue lors de la connexion administrateur';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Email, mot de passe et code administrateur requis';
          break;
        case 401:
          errorMessage = 'Identifiants administrateur invalides';
          break;
        case 403:
          errorMessage = 'Accès refusé - Droits administrateur insuffisants';
          break;
        case 422:
          errorMessage = 'Le code administrateur doit contenir exactement 4 chiffres';
          break;
        case 500:
          errorMessage = 'Erreur serveur - Contactez le support technique';
          break;
        case 0:
          errorMessage = 'Impossible de contacter le serveur d\'authentification';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.error || error.message}`;
      }
    }

    console.error('Erreur AuthService Admin:', error);
    return throwError(() => new Error(errorMessage));
  };
}
