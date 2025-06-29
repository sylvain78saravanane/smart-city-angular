import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatChipsModule} from '@angular/material/chips';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';
import {AuthService, LoginResponse} from '../services/auth.service';
import {CommentaireService, CreateCommentaireDTO, ResponseCommentaireDTO} from '../services/commentaire-service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-page-commentaires',
  standalone : true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule,
    Header,
    Footer,
  ],
  templateUrl: './page-commentaires.html',
  styleUrl: './page-commentaires.css'
})
export class PageCommentaires implements OnInit {

  commentaireForm: FormGroup;
  currentUser: LoginResponse | null = null;

  // Signals pour la gestion d'état
  isLoading = signal(false);
  isSubmitting = signal(false);
  commentaires = signal<ResponseCommentaireDTO[]>([]);
  commentairesPopulaires = signal<ResponseCommentaireDTO[]>([]);

  // Options pour les sujets
  sujets = [
    { value: 'CAPTEUR', label: '📡 Amélioration des capteurs' },
    { value: 'POLLUTION', label: '🏭 Pollution' },
    { value: 'TRAFIC', label: '🚗 Trafic routier' },
    { value: 'BRUIT', label: '🔊 Nuisances sonores' },
    { value: 'LUMINOSITE', label: '💡 Éclairage public' },
    { value: 'INFRASTRUCTURE', label: '🏗️ Infrastructure' },
    { value: 'SECURITE', label: '🛡️ Sécurité' },
    { value: 'ENVIRONNEMENT', label: '🌱 Environnement' },
    { value: 'SUGGESTIONS', label: '💡 Suggestions générales' },
    { value: 'GENERAL', label: '📝 Général' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private commentaireService: CommentaireService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.commentaireForm = this.fb.group({
      titre: [''],
      contenu: ['', [Validators.required, Validators.minLength(10)]],
      sujet: ['GENERAL'],
      noteEvaluation: [null],
      localisation: ['']
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'CITOYEN') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCommentaires();
  }

  /**
   * Charger les commentaires récents et populaires
   */
  loadCommentaires() {
    this.isLoading.set(true);

    // Charger les commentaires récents
    this.commentaireService.getCommentairesRecents(30).subscribe({
      next: (response) => {
        this.commentaires.set(response.commentaires || []);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commentaires:', error);
        this.snackBar.open('Erreur lors du chargement des commentaires', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });

    // Charger les commentaires populaires
    this.commentaireService.getCommentairesPopulaires(5).subscribe({
      next: (response) => {
        this.commentairesPopulaires.set(response.commentaires || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commentaires populaires:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Soumettre un nouveau commentaire
   */
  onSubmit() {
    if (this.commentaireForm.valid && this.currentUser) {
      this.isSubmitting.set(true);

      const formValue = this.commentaireForm.value;
      const commentaireData: CreateCommentaireDTO = {
        titre: formValue.titre || undefined,
        contenu: formValue.contenu,
        sujet: formValue.sujet,
        noteEvaluation: formValue.noteEvaluation || undefined,
        localisation: formValue.localisation || undefined,
        idCitoyen: this.currentUser.idUtilisateur
      };

      this.commentaireService.createCommentaire(commentaireData).subscribe({
        next: (response) => {
          this.snackBar.open('Commentaire publié avec succès !', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          // Réinitialiser le formulaire
          this.commentaireForm.reset();
          this.commentaireForm.patchValue({ sujet: 'GENERAL' });

          // Recharger les commentaires
          this.loadCommentaires();

          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Erreur lors de la création du commentaire:', error);
          this.snackBar.open(
            error.message || 'Erreur lors de la publication du commentaire',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Ajouter un like à un commentaire
   */
  toggleLike(commentaire: ResponseCommentaireDTO) {
    this.commentaireService.ajouterLike(commentaire.idCommentaire).subscribe({
      next: () => {
        // Mettre à jour localement le nombre de likes
        const commentaires = this.commentaires();
        const index = commentaires.findIndex(c => c.idCommentaire === commentaire.idCommentaire);
        if (index !== -1) {
          commentaires[index].nombreLikes += 1;
          this.commentaires.set([...commentaires]);
        }

        this.snackBar.open('👍 Like ajouté !', '', { duration: 1000 });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du like:', error);
      }
    });
  }

  /**
   * Ajouter un dislike à un commentaire
   */
  toggleDislike(commentaire: ResponseCommentaireDTO) {
    this.commentaireService.ajouterDislike(commentaire.idCommentaire).subscribe({
      next: () => {
        // Mettre à jour localement le nombre de dislikes
        const commentaires = this.commentaires();
        const index = commentaires.findIndex(c => c.idCommentaire === commentaire.idCommentaire);
        if (index !== -1) {
          commentaires[index].nombreDislikes += 1;
          this.commentaires.set([...commentaires]);
        }

        this.snackBar.open('👎 Dislike ajouté !', '', { duration: 1000 });
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du dislike:', error);
      }
    });
  }

  /**
   * Obtenir l'icône pour un sujet
   */
  getSujetIcon(sujet: string): string {
    const sujetObj = this.sujets.find(s => s.value === sujet);
    return sujetObj ? sujetObj.label.split(' ')[0] : '📝';
  }

  /**
   * Obtenir le label pour un sujet
   */
  getSujetLabel(sujet: string): string {
    const sujetObj = this.sujets.find(s => s.value === sujet);
    return sujetObj ? sujetObj.label.substring(2) : sujet;
  }

  /**
   * Formater la date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Marquer tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched() {
    Object.keys(this.commentaireForm.controls).forEach(key => {
      const control = this.commentaireForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtenir le message d'erreur pour le contenu
   */
  getContenuErrorMessage(): string {
    const contenuControl = this.commentaireForm.get('contenu');
    if (contenuControl?.hasError('required')) {
      return 'Le contenu est obligatoire';
    }
    if (contenuControl?.hasError('minlength')) {
      return 'Le contenu doit contenir au moins 10 caractères';
    }
    return '';
  }

  /**
   * Retourner au dashboard
   */
  goBack() {
    this.router.navigate(['/dashboard']);
  }

}
