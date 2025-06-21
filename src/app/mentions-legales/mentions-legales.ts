import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import {Router} from '@angular/router';

interface LegalSection {
  title: string;
  content: string[];
  icon: string;
}

@Component({
  selector: 'app-mentions-legales',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    Header,
    Footer
  ],
  templateUrl: './mentions-legales.html',
  styleUrl: './mentions-legales.css'
})
export class MentionsLegales {
  companyInfo = {
    name: 'Smart City IoT',
    legalForm: 'Société par Actions Simplifiée (SAS)',
    capital: '100 000 €',
    siret: '123 456 789 00012',
    rcs: 'RCS Paris 123 456 789',
    tva: 'FR12 123456789',
    address: '123 Avenue de l\'Innovation',
    city: '75001 Paris',
    country: 'France',
    phone: '+33 1 23 45 67 89',
    email: 'contact@smartcityiot.fr'
  };

  // Équipe dirigeante
  management = [
    {
      role: 'Directeur de la Solution "SMART CITY IOT"',
      name: 'Sylvain Saravanane',
    },
  ];

  // Prestataires
  providers = {
    hosting: {
      name: 'Microsoft AZURE',
      address: '37/45 37 QUAI DU PRESIDENT ROOSEVELT',
      phone: '+33 09 70 01 90 901'
    },
    development: {
      name: 'Équipe interne Smart City IoT',
      contact: 'dev@smartcityiot.fr'
    }
  };

  // Sections légales détaillées
  legalSections: LegalSection[] = [
    {
      title: 'Conditions d\'utilisation',
      icon: 'description',
      content: [
        'L\'accès et l\'utilisation du site Smart City IoT sont soumis aux présentes mentions légales.',
        'En naviguant sur ce site, vous acceptez sans réserve les présentes conditions d\'utilisation.',
        'Smart City IoT se réserve le droit de modifier ces conditions à tout moment.',
        'Les utilisateurs sont invités à consulter régulièrement cette page pour prendre connaissance des éventuelles modifications.'
      ]
    },
    {
      title: 'Propriété intellectuelle',
      icon: 'copyright',
      content: [
        'L\'ensemble des contenus présents sur le site Smart City IoT (textes, images, logos, icônes, sons, logiciels) sont la propriété exclusive de Smart City IoT ou de ses partenaires.',
        'Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.',
        'Les marques et logos présents sur le site sont déposés par Smart City IoT ou par des tiers ayant autorisé leur utilisation.',
        'Toute utilisation non autorisée de ces éléments constitue une contrefaçon passible de sanctions pénales.'
      ]
    },
    {
      title: 'Protection des données personnelles',
      icon: 'security',
      content: [
        'Smart City IoT s\'engage à respecter la confidentialité des données personnelles collectées sur son site.',
        'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données.',
        'Les données collectées sont utilisées uniquement dans le cadre des services proposés par Smart City IoT.',
        'Aucune donnée personnelle n\'est vendue ou transmise à des tiers sans votre consentement explicite.',
        'Pour exercer vos droits, contactez-nous à l\'adresse : privacy@smartcityiot.fr'
      ]
    },
    {
      title: 'Cookies et technologies similaires',
      icon: 'cookie',
      content: [
        'Le site Smart City IoT utilise des cookies pour améliorer l\'expérience utilisateur et analyser le trafic.',
        'Les cookies techniques sont nécessaires au bon fonctionnement du site et ne nécessitent pas de consentement.',
        'Les cookies analytiques nous aident à comprendre comment les visiteurs utilisent notre site.',
        'Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités.',
        'Pour plus d\'informations, consultez notre politique de cookies.'
      ]
    },
    {
      title: 'Responsabilité et garanties',
      icon: 'shield',
      content: [
        'Smart City IoT s\'efforce d\'assurer l\'exactitude et la mise à jour des informations diffusées sur ce site.',
        'Toutefois, Smart City IoT ne peut garantir l\'exactitude, la précision ou l\'exhaustivité des informations.',
        'L\'utilisation des informations et contenus disponibles sur l\'ensemble du site ne saurait engager la responsabilité de Smart City IoT.',
        'Smart City IoT ne pourra être tenue responsable des dommages directs ou indirects causés au matériel de l\'utilisateur.',
        'Les liens hypertextes vers d\'autres sites sont fournis à titre informatif et n\'engagent pas la responsabilité de Smart City IoT.'
      ]
    },
    {
      title: 'Droit applicable et juridiction',
      icon: 'gavel',
      content: [
        'Les présentes mentions légales sont régies par le droit français.',
        'En cas de litige, les tribunaux français seront seuls compétents.',
        'Les parties s\'engagent à rechercher une solution amiable avant toute action judiciaire.',
        'À défaut d\'accord amiable, le litige sera porté devant les tribunaux compétents de Paris.'
      ]
    }
  ];

  // Date de dernière mise à jour
  lastUpdate = new Date('2025-01-20');

  constructor(private router: Router) {}

  onContactUs() {
    this.router.navigate(['/contact']);
  }

  onPrivacyPolicy() {
    // Rediriger vers la politique de confidentialité
    this.router.navigate(['/privacy']);
  }

  onBackToHome() {
    this.router.navigate(['/']);
  }

  // Méthode pour formater la date

}
