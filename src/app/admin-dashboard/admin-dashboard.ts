// src/app/admin-dashboard/admin-dashboard.ts - Version corrigée finale

import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule} from '@angular/material/table';
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
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import {AdminLoginResponse, AuthService} from '../services/auth.service';
import {Router} from '@angular/router';

interface DashboardStats {
  utilisateurs: {
    total: number;
    citoyens: number;
    gestionnaires: number;
    chercheurs: number;
    admins: number;
    actifs: number;
  };
  capteurs: {
    total: number;
    actifs: number;
    maintenance: number;
    defaillants: number;
    parType: { [key: string]: number };
  };
  alertes: {
    total: number;
    critiques: number;
    moyennes: number;
    faibles: number;
    actives: number;
  };
  donnees: {
    totalPoints: number;
    derniere24h: number;
    qualiteMoyenne: number;
    capteursPlusActifs: Array<{nom: string, points: number}>;
  };
}

interface RecentActivity {
  id: number;
  type: 'user' | 'sensor' | 'alert' | 'data';
  action: string;
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: string;
}

interface SystemAlert {
  id: number;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
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
    Header,
    Footer
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  currentAdmin = signal<AdminLoginResponse | null>(null);
  stats = signal<DashboardStats>({
    utilisateurs: {
      total: 0,
      citoyens: 0,
      gestionnaires: 0,
      chercheurs: 0,
      admins: 0,
      actifs: 0
    },
    capteurs: {
      total: 0,
      actifs: 0,
      maintenance: 0,
      defaillants: 0,
      parType: {}
    },
    alertes: {
      total: 0,
      critiques: 0,
      moyennes: 0,
      faibles: 0,
      actives: 0
    },
    donnees: {
      totalPoints: 0,
      derniere24h: 0,
      qualiteMoyenne: 0,
      capteursPlusActifs: []
    }
  });

  recentActivities = signal<RecentActivity[]>([]);
  systemAlerts = signal<SystemAlert[]>([]);
  isLoading = signal(false);
  selectedTabIndex = signal(0);

  // Colonnes pour les tableaux
  displayedColumnsActivities = ['type', 'action', 'description', 'timestamp', 'severity'];
  displayedColumnsAlerts = ['type', 'title', 'message', 'timestamp', 'actions'];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAdminInfo();
    this.loadDashboardData();
    this.loadRecentActivities();
    this.loadSystemAlerts();

    // Refresh des données toutes les 30 secondes
    setInterval(() => {
      this.refreshDashboardData();
    }, 30000);
  }

  private loadAdminInfo() {
    const user = this.authService.getCurrentUser() as AdminLoginResponse;

    if (!user || user.role !== 'ADMINISTRATEUR') {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.currentAdmin.set(user);
  }

  private loadDashboardData() {
    this.isLoading.set(true);

    // Simulation des données - À remplacer par de vrais appels API
    setTimeout(() => {
      this.stats.set({
        utilisateurs: {
          total: 1247,
          citoyens: 1156,
          gestionnaires: 45,
          chercheurs: 38,
          admins: 8,
          actifs: 1198
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
        },
        alertes: {
          total: 234,
          critiques: 12,
          moyennes: 45,
          faibles: 177,
          actives: 89
        },
        donnees: {
          totalPoints: 2847563,
          derniere24h: 15420,
          qualiteMoyenne: 87.5,
          capteursPlusActifs: [
            { nom: 'Capteur Centre-Ville #001', points: 1250 },
            { nom: 'Capteur Gare #015', points: 1180 },
            { nom: 'Capteur Parc #008', points: 1050 },
            { nom: 'Capteur Université #022', points: 980 }
          ]
        }
      });

      this.isLoading.set(false);
    }, 1000);
  }

  private loadRecentActivities() {
    // Simulation des activités récentes
    const activities: RecentActivity[] = [
      {
        id: 1,
        type: 'user',
        action: 'Création utilisateur',
        description: 'Nouveau citoyen inscrit: jean.dupont@email.com',
        timestamp: new Date(Date.now() - 300000), // 5 min ago
        severity: 'low',
        user: 'Auto-inscription'
      },
      {
        id: 2,
        type: 'sensor',
        action: 'Capteur hors ligne',
        description: 'Capteur #045 (Pollution) ne répond plus',
        timestamp: new Date(Date.now() - 900000), // 15 min ago
        severity: 'high',
        user: 'Système'
      },
      {
        id: 3,
        type: 'alert',
        action: 'Alerte déclenchée',
        description: 'Seuil de pollution dépassé - Zone Centre-ville',
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        severity: 'critical',
        user: 'Capteur #012'
      },
      {
        id: 4,
        type: 'data',
        action: 'Collecte données',
        description: '1,250 nouveaux points de données traités',
        timestamp: new Date(Date.now() - 3600000), // 1h ago
        severity: 'low',
        user: 'Système'
      },
      {
        id: 5,
        type: 'user',
        action: 'Modification permissions',
        description: 'Permissions gestionnaire mises à jour pour marie.martin@ville.fr',
        timestamp: new Date(Date.now() - 7200000), // 2h ago
        severity: 'medium',
        user: 'admin@smartcityiot.fr'
      }
    ];

    this.recentActivities.set(activities);
  }

  private loadSystemAlerts() {
    // Simulation des alertes système
    const alerts: SystemAlert[] = [
      {
        id: 1,
        type: 'error',
        title: 'Erreur base de données',
        message: 'Connexion intermittente à la base de données de production',
        timestamp: new Date(Date.now() - 600000), // 10 min ago
        acknowledged: false,
        source: 'Base de données'
      },
      {
        id: 2,
        type: 'warning',
        title: 'Espace disque faible',
        message: 'Serveur de stockage à 85% de capacité',
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        acknowledged: false,
        source: 'Infrastructure'
      },
      {
        id: 3,
        type: 'info',
        title: 'Maintenance programmée',
        message: 'Maintenance du cluster Kafka prévue demain à 2h00',
        timestamp: new Date(Date.now() - 3600000), // 1h ago
        acknowledged: true,
        source: 'Planification'
      }
    ];

    this.systemAlerts.set(alerts);
  }

  private refreshDashboardData() {
    // Mise à jour légère des données sans rechargement complet
    this.stats.update(stats => ({
      ...stats,
      donnees: {
        ...stats.donnees,
        derniere24h: stats.donnees.derniere24h + Math.floor(Math.random() * 50),
        totalPoints: stats.donnees.totalPoints + Math.floor(Math.random() * 100)
      }
    }));
  }

  getGridCols(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 4;
    }
    return 4;
  }

  logout() {
    this.authService.logoutAdmin();
    this.router.navigate(['/admin/login']);
  }

  // Méthodes de navigation
  navigateToUsers() {
    console.log('Navigation vers gestion utilisateurs');
    // this.router.navigate(['/admin/users']);
  }

  navigateToSensors() {
    console.log('Navigation vers gestion capteurs');
    // this.router.navigate(['/admin/sensors']);
  }

  navigateToAlerts() {
    console.log('Navigation vers gestion alertes');
    // this.router.navigate(['/admin/alerts']);
  }

  navigateToData() {
    console.log('Navigation vers données IoT');
    // this.router.navigate(['/admin/data']);
  }

  navigateToSettings() {
    console.log('Navigation vers paramètres');
    // this.router.navigate(['/admin/settings']);
  }

  navigateToReports() {
    console.log('Navigation vers rapports');
    // this.router.navigate(['/admin/reports']);
  }

  // Méthodes pour les alertes système
  acknowledgeAlert(alertId: number) {
    this.systemAlerts.update(alerts =>
      alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }

  dismissAlert(alertId: number) {
    this.systemAlerts.update(alerts =>
      alerts.filter(alert => alert.id !== alertId)
    );
  }

  // Méthodes utilitaires
  getActivityIcon(type: string): string {
    switch (type) {
      case 'user': return 'person';
      case 'sensor': return 'sensors';
      case 'alert': return 'warning';
      case 'data': return 'analytics';
      default: return 'info';
    }
  }

  getActivityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }

  getAlertColor(type: string): string {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  // Méthodes pour les actions rapides
  exportData() {
    console.log('Export des données demandé');
    // Logique d'export
  }

  backupSystem() {
    console.log('Sauvegarde système demandée');
    // Logique de sauvegarde
  }

  viewLogs() {
    console.log('Consultation des logs demandée');
    // Navigation vers les logs
  }

  managePermissions() {
    console.log('Gestion des permissions demandée');
    // Navigation vers gestion permissions
  }

  // SUPPRIMÉ LES LIGNES PROBLÉMATIQUES :
  // protected readonly length = length;
  // protected readonly a = a;
  protected readonly alert = alert;
}
