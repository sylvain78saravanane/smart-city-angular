import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Header} from './header/header';
import {PageConnexion} from './page-connexion/page-connexion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, PageConnexion],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'smart-city-iot';
}
