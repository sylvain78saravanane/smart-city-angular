import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';

interface ContactInfo {
  label: string;
  value: string;
  icon: string;
  link?: string;
}

@Component({
  selector: 'app-page-plan',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    Header,
    Footer

  ],
  templateUrl: './page-plan.html',
  styleUrl: './page-plan.css'
})
export class PagePlan {

  // Informations de localisation
  locationInfo = {
    title: 'Smart City IoT - TechCity',
    address: '123 Avenue de l\'Innovation',
    city: 'TechCity, 75001',
    country: 'France'
  };

  // Informations de contact
  contactDetails: ContactInfo[] = [
    {
      label: 'Adresse',
      value: '2 Rue du Mont Thabor, 75001, France',
      icon: 'location_on'
    },
    {
      label: 'Téléphone',
      value: '+33 1 23 45 67 89',
      icon: 'phone',
      link: 'tel:+33123456789'
    },
    {
      label: 'Email',
      value: 'contact@smartcityiot.fr',
      icon: 'email',
      link: 'mailto:contact@smartcityiot.fr'
    },
    {
      label: 'Horaires',
      value: 'Lundi - Vendredi : 9h00 - 18h00',
      icon: 'schedule'
    },
    {
      label: 'Transport',
      value: 'Métro Ligne 1 - Station Tuileries',
      icon: 'train'
    }
  ];

  // Informations pratiques
  practicalInfo = [
    {
      title: 'Accès',
      description: 'Bâtiment moderne avec accès PMR',
      icon: 'accessible'
    },
    {
      title: 'Parking',
      description: 'Parking gratuit disponible',
      icon: 'local_parking'
    },
    {
      title: 'Transports',
      description: 'Métro, bus et vélos en libre-service',
      icon: 'directions_transit'
    }
  ];

  constructor() {}

  // Actions
  onOpenMaps() {
    const address = encodeURIComponent(`${this.locationInfo.address}, ${this.locationInfo.city}, ${this.locationInfo.country}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(googleMapsUrl, '_blank');
  }

  onGetDirections() {
    const address = encodeURIComponent(`${this.locationInfo.address}, ${this.locationInfo.city}, ${this.locationInfo.country}`);
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    window.open(directionsUrl, '_blank');
  }

  onContactAction(contact: ContactInfo) {
    if (contact.link) {
      if (contact.link.startsWith('tel:')) {
        window.location.href = contact.link;
      } else if (contact.link.startsWith('mailto:')) {
        window.location.href = contact.link;
      }
    }
  }

  onImageError(event: any) {
    console.log('Erreur de chargement de l\'image du plan');
    event.target.style.display = 'none';
    // Afficher un placeholder ou message d'erreur
    const placeholder = event.target.parentElement?.querySelector('.image-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

}
