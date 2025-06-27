import { Component } from '@angular/core';
import {MatProgressBar} from '@angular/material/progress-bar';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [
    MatProgressBar
  ],
  templateUrl: './error-page.html',
  styleUrl: './error-page.css'
})
export class ErrorPage {

}
