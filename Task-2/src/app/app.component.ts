import { Component, OnInit, inject, ViewChild } from '@angular/core';
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
import { DeleteNoteComponent } from './delete-note/delete-note.component';

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
  showIcon = true;
  public myError = (controlName: string, errorName: string) => {
    return this.noteFormGroup.controls[controlName].hasError(errorName);
  };

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
        console.log(this.notesList.length);
        this.filterNotesBytab();
      }
      this.spinnerService.dismissSpinner();
    });
  }

  saveNote() {
    //We can go th easy way with fornGrou.invali boolean an throw error but required validation was not giving when is empty. So going this way as got less time for now
    console.log(this.noteFormGroup.valid);
    if (this.noteFormGroup.invalid) {
      this.snack.open('Enter valid data of note!', 'Okay', {
        duration: 2000,
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
            this.noteFormGroup.controls['title'].setErrors(null);
            this.noteFormGroup.controls['status'].setErrors(null);
          })
          .catch((er) => {
            this.snack.open('Error adding Notes!', 'Okay', {
              duration: 2000,
            });
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
        'Notes list is empty. Save notes for report generation!',
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
    this.showIcon = false;
    let element = document.getElementById('notestable');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['E1'];
    delete ws['E3'];
    delete ws['E4'];
    delete ws['E5'];
    delete ws['E6'];
    delete ws['E7'];
    var wid = [{ wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }];
    ws['!cols'] = wid;
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notes');
    XLSX.writeFile(wb, 'NotesList.xlsx');
    this.snack.open('Excel file saved to downloads folder!', 'Okay', {
      duration: 2000,
    });
    setTimeout(() => {
      this.showIcon = true;
    }, 2000);
  }
  editNote(note: Note) {
    const sd = this.dialog.open(EditNotesComponent, { data: note });
    sd.afterClosed().subscribe((rr) => {
      this.getNotes();
    });
  }
  deleteNote(note: Note) {
    const delDialog = this.dialog.open(DeleteNoteComponent, { data: note });
    delDialog.afterClosed().subscribe((rr) => {
      this.getNotes();
    });
  }
}
