import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatChipsModule} from '@angular/material/chips';
import {MatBadgeModule} from '@angular/material/badge';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule, MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatExpansionModule} from '@angular/material/expansion';
import {ReactiveFormsModule} from '@angular/forms';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import {AdminLoginResponse, AuthService} from '../services/auth.service';
import {CapteurService, ResponseCapteurDTO} from '../services/capteur-service';
import {Router} from '@angular/router';

// Interfaces pour la gestion des utilisateurs
interface UtilisateurAdmin {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  typeUtilisateur: string;
  actif: boolean;
  dateCreation?: Date;
  derniereConnexion?: Date;
  nombrePermissions?: number;
  donneesSpecifiques?: any;
}

interface DashboardStats {
  utilisateurs: {
    total: number;
    citoyens: number;
    gestionnaires: number;
    chercheurs: number;
    admins: number;
    actifs: number;
    inactifs: number;
  };
  capteurs: {
    total: number;
    actifs: number;
    maintenance: number;
    defaillants: number;
    parType: { [key: string]: number };
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatExpansionModule,
    ReactiveFormsModule,
    Header,
    Footer
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  currentAdmin = signal<AdminLoginResponse | null>(null);

  // Variables pour l'affichage des sections
  showUsersSection = false;
  showCapteursSection = false;
  showPermissionsSection = false;

  // Stats du dashboard
  stats = signal<DashboardStats>({
    utilisateurs: {
      total: 1247,
      citoyens: 1156,
      gestionnaires: 45,
      chercheurs: 38,
      admins: 8,
      actifs: 1198,
      inactifs: 49
    },
    capteurs: {
      total: 156,
      actifs: 142,
      maintenance: 8,
      defaillants: 6,
      parType: {
        'TEMPERATURE': 45,
        'HUMIDITE': 32,
        'POLLUTION': 28,
        'TRAFIC': 21,
        'BRUIT': 18,
        'LUMINOSITE': 12
      }
    }
  });

  // Données pour les tableaux
  utilisateurs = signal<UtilisateurAdmin[]>([]);
  capteurs = signal<ResponseCapteurDTO[]>([]);

  // DataSources pour Material Table
  utilisateursDataSource = new MatTableDataSource<UtilisateurAdmin>([]);
  capteursDataSource = new MatTableDataSource<ResponseCapteurDTO>([]);

  constructor(
    private authService: AuthService,
    private capteurService: CapteurService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAdminInfo();
    this.loadUtilisateurs();
    this.loadCapteurs();
  }

  private loadAdminInfo() {
    const user = this.authService.getCurrentUser() as AdminLoginResponse;
    if (!user || user.role !== 'ADMINISTRATEUR') {
      this.router.navigate(['/admin/login']);
      return;
    }
    this.currentAdmin.set(user);
  }

  private loadUtilisateurs() {
    // Simulation des données utilisateurs
    const utilisateursSimules: UtilisateurAdmin[] = [
      {
        idUtilisateur: 1,
        nom: 'Martin',
        prenom: 'Jean',
        email: 'jean.martin@email.fr',
        role: 'CITOYEN',
        typeUtilisateur: 'CITOYEN',
        actif: true,
        dateCreation: new Date('2023-01-15'),
        derniereConnexion: new Date('2024-01-01'),
        nombrePermissions: 3
      },
      {
        idUtilisateur: 2,
        nom: 'Dubois',
        prenom: 'Marie',
        email: 'marie.dubois@ville.fr',
        role: 'GESTIONNAIRE_VILLE',
        typeUtilisateur: 'GESTIONNAIRE_VILLE',
        actif: true,
        dateCreation: new Date('2023-02-10'),
        derniereConnexion: new Date('2024-01-02'),
        nombrePermissions: 8
      },
      {
        idUtilisateur: 3,
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'pierre.bernard@univ.fr',
        role: 'CHERCHEUR',
        typeUtilisateur: 'CHERCHEUR',
        actif: true,
        dateCreation: new Date('2023-03-05'),
        derniereConnexion: new Date('2023-12-30'),
        nombrePermissions: 5
      },
      {
        idUtilisateur: 4,
        nom: 'Moreau',
        prenom: 'Sophie',
        email: 'sophie.moreau@email.fr',
        role: 'CITOYEN',
        typeUtilisateur: 'CITOYEN',
        actif: false,
        dateCreation: new Date('2023-04-20'),
        derniereConnexion: new Date('2023-11-15'),
        nombrePermissions: 2
      },
      {
        idUtilisateur: 5,
        nom: 'Leroy',
        prenom: 'Paul',
        email: 'paul.leroy@smartcity.fr',
        role: 'ADMINISTRATEUR',
        typeUtilisateur: 'ADMINISTRATEUR',
        actif: true,
        dateCreation: new Date('2022-12-01'),
        derniereConnexion: new Date('2024-01-03'),
        nombrePermissions: 15
      }
    ];

    this.utilisateurs.set(utilisateursSimules);
    this.utilisateursDataSource.data = utilisateursSimules;
  }

  private loadCapteurs() {
    this.capteurService.getAllCapteurs().subscribe({
      next: (response) => {
        this.capteurs.set(response.capteurs);
        this.capteursDataSource.data = response.capteurs;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des capteurs:', error);
        this.snackBar.open('Erreur lors du chargement des capteurs', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });

        // Données simulées en cas d'erreur
        const capteursSimules: any[] = [
          {
            idCapteur: 1,
            nomCapteur: 'Capteur Centre-Ville #001',
            typeCapteur: 'TEMPERATURE',
            statut: 'ACTIF',
            nomGestionnaireResponsable: 'Marie Dubois',
            typeGestionnaire: 'GESTIONNAIRE_VILLE',
            dateInstallation: new Date('2023-06-15')
          },
          {
            idCapteur: 2,
            nomCapteur: 'Capteur Pollution #015',
            typeCapteur: 'POLLUTION',
            statut: 'MAINTENANCE',
            nomGestionnaireResponsable: 'Paul Leroy',
            typeGestionnaire: 'ADMINISTRATEUR',
            dateInstallation: new Date('2023-08-20')
          },
          {
            idCapteur: 3,
            nomCapteur: 'Capteur Trafic #008',
            typeCapteur: 'TRAFIC',
            statut: 'DEFAILLANT',
            nomGestionnaireResponsable: 'Marie Dubois',
            typeGestionnaire: 'GESTIONNAIRE_VILLE',
            dateInstallation: new Date('2023-05-10')
          }
        ];
        this.capteurs.set(capteursSimules);
        this.capteursDataSource.data = capteursSimules;
      }
    });
  }

  // Méthodes pour la gestion des utilisateurs
  modifierUtilisateur(utilisateur: UtilisateurAdmin) {
    console.log('Modification utilisateur:', utilisateur);
    this.snackBar.open('Fonctionnalité de modification en cours de développement', 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  supprimerUtilisateur(utilisateur: UtilisateurAdmin) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      // Supprimer de la liste locale
      const utilisateursActuels = this.utilisateurs();
      const nouveauxUtilisateurs = utilisateursActuels.filter(u => u.idUtilisateur !== utilisateur.idUtilisateur);
      this.utilisateurs.set(nouveauxUtilisateurs);
      this.utilisateursDataSource.data = nouveauxUtilisateurs;

      // Mettre à jour les stats
      this.stats.update(stats => ({
        ...stats,
        utilisateurs: {
          ...stats.utilisateurs,
          total: stats.utilisateurs.total - 1,
          actifs: utilisateur.actif ? stats.utilisateurs.actifs - 1 : stats.utilisateurs.actifs,
          inactifs: !utilisateur.actif ? stats.utilisateurs.inactifs - 1 : stats.utilisateurs.inactifs
        }
      }));

      console.log('Suppression utilisateur:', utilisateur);
      this.snackBar.open('Utilisateur supprimé avec succès', 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  changerStatutUtilisateur(utilisateur: UtilisateurAdmin) {
    const ancienStatut = utilisateur.actif;
    utilisateur.actif = !utilisateur.actif;

    // Mettre à jour dans la liste
    const utilisateursActuels = this.utilisateurs();
    const index = utilisateursActuels.findIndex(u => u.idUtilisateur === utilisateur.idUtilisateur);
    if (index !== -1) {
      utilisateursActuels[index] = utilisateur;
      this.utilisateurs.set([...utilisateursActuels]);
      this.utilisateursDataSource.data = utilisateursActuels;
    }

    // Mettre à jour les stats
    this.stats.update(stats => ({
      ...stats,
      utilisateurs: {
        ...stats.utilisateurs,
        actifs: utilisateur.actif ? stats.utilisateurs.actifs + 1 : stats.utilisateurs.actifs - 1,
        inactifs: !utilisateur.actif ? stats.utilisateurs.inactifs + 1 : stats.utilisateurs.inactifs - 1
      }
    }));

    console.log('Changement statut utilisateur:', utilisateur);
    this.snackBar.open(
      `Utilisateur ${utilisateur.actif ? 'activé' : 'désactivé'}`,
      'Fermer',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

  // Méthodes pour la gestion des capteurs
  modifierCapteur(capteur: ResponseCapteurDTO) {
    console.log('Modification capteur:', capteur);
    this.router.navigate(['/dashboard/administrateur/capteur'], {
      queryParams: { id: capteur.idCapteur, action: 'edit' }
    });
  }

  supprimerCapteur(capteur: ResponseCapteurDTO) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le capteur ${capteur.nomCapteur} ?`)) {
      this.capteurService.deleteCapteur(capteur.idCapteur).subscribe({
        next: () => {
          // Supprimer de la liste locale
          const capteursActuels = this.capteurs();
          const nouveauxCapteurs = capteursActuels.filter(c => c.idCapteur !== capteur.idCapteur);
          this.capteurs.set(nouveauxCapteurs);
          this.capteursDataSource.data = nouveauxCapteurs;

          // Mettre à jour les stats
          this.stats.update(stats => ({
            ...stats,
            capteurs: {
              ...stats.capteurs,
              total: stats.capteurs.total - 1,
              actifs: capteur.statut === 'ACTIF' ? stats.capteurs.actifs - 1 : stats.capteurs.actifs,
              maintenance: capteur.statut === 'MAINTENANCE' ? stats.capteurs.maintenance - 1 : stats.capteurs.maintenance,
              defaillants: capteur.statut === 'DEFAILLANT' ? stats.capteurs.defaillants - 1 : stats.capteurs.defaillants
            }
          }));

          this.snackBar.open('Capteur supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  navigateToCreateCapteur() {
    this.router.navigate(['/dashboard/administrateur/capteur'], {
      queryParams: { action: 'create' }
    });
  }

  // Méthodes utilitaires
  getGridCols(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 2;
    }
    return 2;
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMINISTRATEUR': return 'warn';
      case 'GESTIONNAIRE_VILLE': return 'accent';
      case 'CHERCHEUR': return 'primary';
      case 'CITOYEN': return '';
      default: return '';
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'primary';
      case 'INACTIF': return '';
      case 'MAINTENANCE': return 'accent';
      case 'DEFAILLANT': return 'warn';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  logout() {
    this.authService.logoutAdmin();
    this.router.navigate(['/login/administrateur']);
  }

  // Méthodes pour les actions rapides
  exportData() {
    console.log('Export des données demandé');
    this.snackBar.open('Export des données en cours...', 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  backupSystem() {
    console.log('Sauvegarde système demandée');
    this.snackBar.open('Sauvegarde système lancée', 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  viewLogs() {
    console.log('Consultation des logs demandée');
    this.snackBar.open('Consultation des logs système', 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  managePermissions() {
    console.log('Gestion des permissions demandée');
    this.showPermissionsSection = !this.showPermissionsSection;
  }

  // Méthodes de navigation pour les sections
  toggleUsersSection() {
    this.showUsersSection = !this.showUsersSection;
  }

  toggleCapteursSection() {
    this.showCapteursSection = !this.showCapteursSection;
  }

  togglePermissionsSection() {
    this.showPermissionsSection = !this.showPermissionsSection;
  }

  // Méthodes pour les statistiques
  getPercentageActifs(): number {
    const stats = this.stats();
    return stats.utilisateurs.total > 0 ?
      Math.round((stats.utilisateurs.actifs / stats.utilisateurs.total) * 100) : 0;
  }

  getPercentageCapteursActifs(): number {
    const stats = this.stats();
    return stats.capteurs.total > 0 ?
      Math.round((stats.capteurs.actifs / stats.capteurs.total) * 100) : 0;
  }

  // Méthodes pour les filtres (à implémenter si nécessaire)
  applyFilterUtilisateurs(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.utilisateursDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyFilterCapteurs(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.capteursDataSource.filter = filterValue.trim().toLowerCase();
  }

  // Méthodes pour la création d'utilisateurs (à implémenter)
  creerUtilisateur() {
    console.log('Création d\'un nouvel utilisateur');
    this.snackBar.open('Formulaire de création d\'utilisateur à implémenter', 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  // Méthodes de validation
  canDeleteUser(user: UtilisateurAdmin): boolean {
    // Ne pas permettre de supprimer le dernier admin
    if (user.role === 'ADMINISTRATEUR') {
      const adminCount = this.utilisateurs().filter(u => u.role === 'ADMINISTRATEUR' && u.actif).length;
      return adminCount > 1;
    }
    return true;
  }

  // Méthodes pour les alertes système
  hasSystemAlerts(): boolean {
    const stats = this.stats();
    return stats.capteurs.defaillants > 0 || stats.capteurs.maintenance > 0;
  }

  getSystemAlertsCount(): number {
    const stats = this.stats();
    return stats.capteurs.defaillants + stats.capteurs.maintenance;
  }
}
