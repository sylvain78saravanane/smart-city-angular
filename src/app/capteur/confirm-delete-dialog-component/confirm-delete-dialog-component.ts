import {Component, Inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-dialog-component',
  imports: [
    MatIconModule
  ],
  templateUrl: './confirm-delete-dialog-component.html',
  styleUrl: './confirm-delete-dialog-component.css'
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
