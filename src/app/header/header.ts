import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-header',
  standalone:true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    RouterModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(current => !current);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  onMenuItemClick() {
    this.closeMobileMenu();
  }
}
