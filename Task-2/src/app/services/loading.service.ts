import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LoadingComponent } from '../loading/loading.component';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  constructor(private dialog: MatDialog) {}

  showSpinner(message: string) {
    this.dialog.open(LoadingComponent, { data: message });
  }

  dismissSpinner() {
    this.dialog.closeAll();
  }
}
