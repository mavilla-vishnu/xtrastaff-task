import { Component, OnInit, inject, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../services/loading.service';
import { Note } from '../app.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { doc, setDoc, addDoc } from '@angular/fire/firestore';
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

@Component({
  selector: 'app-edit-notes',
  templateUrl: './edit-notes.component.html',
  styleUrls: ['./edit-notes.component.scss'],
})
export class EditNotesComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  noteFormGroup: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    status: new FormControl('', [Validators.required]),
  });

  constructor(
    private snack: MatSnackBar,
    private spinnerService: LoadingService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: Note
  ) {}
  ngOnInit() {
    this.noteFormGroup.controls['title'].setValue(this.data.title);
    this.noteFormGroup.controls['status'].setValue(this.data.status);
  }

  saveNote() {
    if (this.noteFormGroup.invalid) {
      this.snack.open('Enter valid title and status of note!', 'Okay', {
        duration: 3000,
      });
      return;
    }
    this.spinnerService.showSpinner('Saving note. Plese wait...');
    var data: Note = {
      id: '',
      title: this.noteFormGroup.controls['title'].value,
      status: this.noteFormGroup.controls['status'].value,
      timestamp: new Date().getTime(),
    };
    updateDoc(doc(this.firestore, 'notes', this.data.id), {
      title: this.noteFormGroup.controls['title'].value,
      status: this.noteFormGroup.controls['status'].value,
    }).then((res) => {
      this.snack.open('Question updated successfully', 'Okay', {
        duration: 2000,
      });
      this.dialog.closeAll();
    });
  }
}
