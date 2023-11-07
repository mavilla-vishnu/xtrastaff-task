import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { createPdf } from 'pdfmake/build/pdfmake';
import * as XLSX from 'xlsx';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { doc, setDoc, addDoc } from '@angular/fire/firestore';
import {
  documentId,
  getDoc,
  updateDoc,
  deleteDoc,
  getFirestore,
} from 'firebase/firestore';
import { MatDialog } from '@angular/material/dialog';
import { EditNotesComponent } from './edit-notes/edit-notes.component';

export interface Note {
  id: string;
  title: string;
  status: string;
  timestamp: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Xtrastaff Task-2';
  firestore: Firestore = inject(Firestore);
  statuses: string[] = [
    'All',
    'Active',
    'Completed',
    'Pending',
    'In-Progress',
    'Rejected',
  ];
  selectedTab = 'All';
  notesList: Note[] = [];
  notesFilteredList: Note[] = [];
  noteFormGroup: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    status: new FormControl('', [Validators.required]),
  });
  notes$: any;

  constructor(
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private spinnerService: LoadingService
  ) {
    (window as any).pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
  ngOnInit() {
    this.getNotes();
  }
  getNotes() {
    this.notesFilteredList = [];
    this.spinnerService.showSpinner('Fetching notes. Please wait...');
    var dd = collection(this.firestore, 'notes');
    this.notes$ = collectionData(dd) as unknown as Observable<Note>;
    this.notes$.subscribe((res: Note[]) => {
      if (res.length > 0) {
        this.notesList = res;
        this.filterNotesBytab();
      }
      this.spinnerService.dismissSpinner();
    });
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
    addDoc(collection(this.firestore, 'notes'), data)
      .then((res) => {
        updateDoc(res, { id: res.id })
          .then((res) => {
            this.snack.open('Notes added successfully!', 'Okay', {
              duration: 2000,
            });
            this.noteFormGroup.reset();
            this.spinnerService.dismissSpinner();
            this.filterNotesBytab();
            this.spinnerService.dismissSpinner();
          })
          .catch((er) => {
            this.snack.open('Error adding Notes!', 'Okay', { duration: 2000 });
            this.spinnerService.dismissSpinner();
          });
      })
      .catch((err) => {
        this.snack.open('Error adding Notes!', 'Okay', { duration: 2000 });
        this.spinnerService.dismissSpinner();
      });
  }
  filterNotesBytab() {
    this.notesFilteredList = [];
    this.noteFormGroup.controls['title'].setErrors(null);
    this.noteFormGroup.controls['status'].setErrors(null);
    switch (this.selectedTab) {
      case 'All':
        this.notesFilteredList = this.notesList;
        break;
      default:
        this.notesFilteredList = this.notesList.filter((nt) => {
          return nt.status.toLowerCase() == this.selectedTab.toLowerCase();
        });
        break;
    }
    this.notesFilteredList.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }
  downloadPdf() {
    if (this.notesList.length == 0) {
      this.snack.open(
        'Notes list empty. Save notes for report generation!',
        'Okay',
        { duration: 3000 }
      );
      return;
    }
    const docDef = {
      header: { text: 'NOTES LIST', style: 'header' },
      styles: {
        header: {
          fontSize: 14,
          bold: true,
        },
      },
      content: [
        { text: '', style: 'ad' },
        this.table(this.notesList, ['title', 'status']),
      ],
    };
    createPdf(docDef).open();
  }
  table(data: any, columns: any) {
    return {
      table: {
        headerRows: 1,
        widths: ['*', 100],
        body: this.buildTableBody(data, columns),
      },
      header: ['Title', 'Status'],
      footer: ['End of Note List'],
    };
  }
  buildTableBody(data: any, columns: any) {
    var body = [];
    var uc = columns.map(function (x: any) {
      let thArray: any = [];
      thArray.push({
        text: x.toUpperCase(),
        style: 'header',
        alignment: 'center',
      });
      return thArray;
    });
    body.push(uc);
    data.forEach(function (row: any) {
      let dataRow: any = [];
      columns.forEach(function (column: any) {
        dataRow.push(row[column].toString());
      });
      body.push(dataRow);
    });
    return body;
  }
  downloadExcel() {
    if (this.notesList.length == 0) {
      this.snack.open(
        'Notes list empty. Save notes for report generation!',
        'Okay',
        { duration: 3000 }
      );
      return;
    }
    let element = document.getElementById('notestable');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notes');
    ws['!cols'] = [];
    XLSX.writeFile(wb, 'NotesList.xlsx');
    this.snack.open('Excel file saved to downloads folder!', 'Okay', {
      duration: 2000,
    });
  }
  editNote(note: Note) {
    const sd = this.dialog.open(EditNotesComponent, { data: note });
    sd.afterClosed().subscribe((rr) => {
      this.getNotes();
    });
  }
  deleteNote(note: Note) {
    const db = getFirestore();
    const docRef = doc(db, 'notes', note.id);
    deleteDoc(docRef).then((res: any) => {
      if (confirm('Are you sure you want to delete this note?') == true) {
        this.snack.open('Document deleted successfully!', 'Okay', {
          duration: 2000,
        });
        this.getNotes();
      }
    });
  }
}
