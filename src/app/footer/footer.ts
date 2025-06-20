import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {RouterModule} from '@angular/router';
import {CheckCircle, Linkedin, LucideAngularModule, Mail, MapPin, Phone, Twitter, Wifi, Youtube} from 'lucide-angular';

@Component({
  selector: 'app-footer',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  currentYear = new Date().getFullYear();

  linkedinIcon = Linkedin;
  twitterIcon = Twitter;
  youtubeIcon = Youtube;


  // Autres icônes Lucide
  mapPinIcon = MapPin;
  phoneIcon = Phone;
  mailIcon = Mail;
  wifiIcon = Wifi;
  checkCircleIcon = CheckCircle;

  // Liens de navigation du footer
  navigationLinks = [
    { label: 'Accueil', route: '/', icon: 'home' },
    { label: 'À propos', route: '/about', icon: 'info' },
    { label: 'Services', route: '/services', icon: 'build' },
    { label: 'Contact', route: '/contact', icon: 'contact_mail' }
  ];

  // Liens légaux
  legalLinks = [
    { label: 'Mentions légales', route: '/mentions-legales' },
    { label: 'Politique de confidentialité', route: '/privacy' },
    { label: 'Conditions d\'utilisation', route: '/terms' },
    { label: 'Plan du site', route: '/sitemap' }
  ];

  // Réseaux sociaux
  socialLinks = [
    {
      label: 'LinkedIn',
      url: '',
      lucideIcon: this.linkedinIcon,
      color: '#0077B5'
    },
    {
      label: 'Twitter',
      url: '',
      color: '#1DA1F2',
      lucideIcon: this.twitterIcon
    },
    {
      label: 'YouTube',
      url: '',
      color: '#FF0000',
      lucideIcon: this.youtubeIcon
    }
  ];

  // Informations de contact
  contactInfo = {
    address: '123 Avenue de l\'Innovation, 75001 Paris, France',
    phone: '+33 1 23 45 67 89',
    email: 'contact@smartcityiot.fr'
  };

  onSocialLinkClick(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onScrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
