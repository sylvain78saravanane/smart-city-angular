import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardModule} from '@angular/material/card';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatGridList, MatGridListModule, MatGridTile} from '@angular/material/grid-list';
import {MatProgressBar, MatProgressBarModule} from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../services/auth.service';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone : true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatProgressBarModule,
    MatCardModule,
    MatGridList,
    MatGridTile,
    MatCard,
    MatCardHeader,
    MatIcon,
    MatCardContent,
    MatCardActions,
    MatProgressBar,
    Footer,
    Header,
    MatButton
  ],
  templateUrl: './citoyen-dashboard.html',
  styleUrl: './citoyen-dashboard.css'
})
export class CitoyenDashboard implements OnInit {

  currentUser: LoginResponse | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Récupérer les informations de l'utilisateur connecté
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'CITOYEN') {
      this.router.navigate(['/login']);
    }
  }

  getGridCols(): number {
    // Responsive grid
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 2;
    }
    return 2;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
