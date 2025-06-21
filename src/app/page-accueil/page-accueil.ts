import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

interface CloudContent {
  id: number;
  title: string;
  content: string;
  icon: string;
  delay: number;
  visible: boolean;
  position: string;
  animation: string;
}

@Component({
  selector: 'app-page-accueil',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    Header,
    Footer
  ],
  templateUrl: './page-accueil.html',
  styleUrl: './page-accueil.css'
})
export class PageAccueil implements OnInit {

  // Signals pour la gestion d'état
  heroVisible = signal(false);
  cloudsStarted = signal(false);
  allCloudsVisible = signal(false);
  buttonsVisible = signal(false);

  // Les 3 nuages simplifiés
  clouds: CloudContent[] = [
    {
      id: 1,
      title: "Qu'est-ce que Smart City IoT ?",
      content: "Smart City IoT est une plateforme innovante qui transforme les villes en écosystèmes intelligents et connectés pour améliorer la qualité de vie des citoyens.",
      icon: "help_outline",
      delay: 1000,
      visible: false,
      position: "",
      animation: ""
    },
    {
      id: 2,
      title: "Notre Mission pour TechCity",
      content: "Smart City IoT prendra en charge les besoins de la ville de \"TechCity\" sur la mise en place d'un réseau de capteurs IoT, pour des collectes en temps réel.",
      icon: "location_city",
      delay: 2000,
      visible: false,
      position: "",
      animation: ""
    },
    {
      id: 3,
      title: "Surveillance Environnementale Avancée",
      content: "Il permettra de surveiller en continu les paramètres environnementaux clés : température, humidité, l'indice UV et la qualité de l'air grâce à une solution IoT avancée combinant des capteurs performants.",
      icon: "sensors",
      delay: 3000,
      visible: false,
      position: "",
      animation: ""
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.startSimpleAnimation();
  }

  private startSimpleAnimation() {
    // 1. Titre apparaît rapidement
    setTimeout(() => {
      this.heroVisible.set(true);
    }, 500);

    // 2. Nuages apparaissent un par un
    this.clouds.forEach((cloud, index) => {
      setTimeout(() => {
        cloud.visible = true;
      }, cloud.delay);
    });

    // 3. Boutons apparaissent à la fin
    setTimeout(() => {
      this.buttonsVisible.set(true);
    }, 4000);
  }

  // Actions des boutons finaux
  onDiscoverSolution() {
    // Scroll vers une section de détails ou redirection
    const detailsSection = document.getElementById('solution-details');
    if (detailsSection) {
      detailsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Si pas de section, on peut rediriger vers une page dédiée
      this.showSolutionDetails();
    }
  }

  onLogin() {
    this.router.navigate(['/login']);
  }

  onRegisterCitoyen() {
    this.router.navigate(['/inscription']);
  }

  // Afficher plus de détails sur la solution
  private showSolutionDetails() {
    // On peut soit scroller vers le bas, soit afficher plus d'infos
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  }
}
