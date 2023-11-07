import { Component, Inject, OnInit } from '@angular/core';
import {
  documentId,
  getDoc,
  updateDoc,
  deleteDoc,
  getFirestore,
} from 'firebase/firestore';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { Note } from '../app.component';
import { doc, setDoc, addDoc } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-delete-note',
  templateUrl: './delete-note.component.html',
  styleUrls: ['./delete-note.component.scss'],
})
export class DeleteNoteComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteNoteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Note,
    private snack: MatSnackBar
  ) {}
  delete() {
    const db = getFirestore();
    const docRef = doc(db, 'notes', this.data.id);
    deleteDoc(docRef).then((res: any) => {
      this.snack.open('Document deleted successfully!', 'Okay', {
        duration: 2000,
      });
      this.dialogRef.close();
    });
  }
}
