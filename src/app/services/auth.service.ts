// src/app/services/auth.service.ts - Version corrigée

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface AdminLoginRequest {
  email: string;
  mot_de_passe: string;
  code_admin: string;
}

// Interface mise à jour pour les données spécifiques
export interface DonneesSpecifiques {
  // Pour les citoyens
  latitude?: number;
  longitude?: number;
  // Pour les administrateurs
  codeAdmin?: string;
  salaire?: number;
  // Pour les gestionnaires
  codeGV?: string;
  nomDepartement?: string;
  // Pour les chercheurs
  institut?: string;
  domaineRecherche?: string;
  // Type général
  type: string;
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
  donneesSpecifiques: DonneesSpecifiques;
  nombrePermissions: number;
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
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
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
    // Utilisation de l'endpoint normal puis vérification côté client
    const loginData = {
      email: credentials.email,
      mot_de_passe: credentials.mot_de_passe
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginData)
      .pipe(
        map(user => {
          // Vérification que c'est bien un admin
          if (user.role !== 'ADMINISTRATEUR') {
            throw new Error('Accès refusé - Droits administrateur requis');
          }

          // Vérification du code admin
          // IMPORTANT: Dans un vrai projet, cette vérification doit se faire côté serveur
          // Ici on simule en comparant avec le codeAdmin retourné par le serveur
          const adminUser = user as AdminLoginResponse;

          // Si le serveur ne retourne pas le code admin, on peut le simuler
          // (à remplacer par la vraie logique de votre backend)
          if (!adminUser.donneesSpecifiques?.codeAdmin) {
            // Simulation pour les tests - À SUPPRIMER en production
            adminUser.donneesSpecifiques = {
              ...adminUser.donneesSpecifiques,
              codeAdmin: '1234', // Code par défaut pour les tests
              salaire: adminUser.donneesSpecifiques?.salaire || 0,
              type: 'ADMINISTRATEUR'
            };
          }

          if (adminUser.donneesSpecifiques.codeAdmin !== credentials.code_admin) {
            throw new Error('Code administrateur incorrect');
          }

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
        catchError(error => {
          console.error('Erreur d\'inscription :', error);
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
   * Vérifier le code administrateur
   */
  verifyAdminCode(codeAdmin: string): boolean {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'ADMINISTRATEUR') {
      return false;
    }
    return user.donneesSpecifiques?.codeAdmin === codeAdmin;
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
    } else if (error instanceof Error) {
      // Erreur custom (ex: code admin incorrect)
      errorMessage = error.message;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides - Vérifiez vos identifiants';
          break;
        case 401:
          errorMessage = 'Accès refusé - Email, mot de passe ou code administrateur incorrect';
          break;
        case 403:
          errorMessage = 'Accès refusé - Droits administrateur insuffisants';
          break;
        case 404:
          errorMessage = 'Compte administrateur non trouvé';
          break;
        case 422:
          errorMessage = 'Code administrateur invalide - 4 chiffres requis';
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
