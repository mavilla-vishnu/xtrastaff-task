import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { createPdf } from 'pdfmake/build/pdfmake';

export interface Note {
  title: string;
  status: string;
  timestamp: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Xtrastaff Task-2';
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

  constructor(private snack: MatSnackBar) {
    (window as any).pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }

  saveNote() {
    if (this.noteFormGroup.invalid) {
      this.snack.open('Enter valid title and status of note!', 'Okay', {
        duration: 3000,
      });
      return;
    }
    this.notesList.push({
      title: this.noteFormGroup.controls['title'].value,
      status: this.noteFormGroup.controls['status'].value,
      timestamp: new Date().getTime(),
    });
    this.noteFormGroup.reset();
    this.filterNotesBytab();
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
          nt.status.toLowerCase() === this.selectedTab.toLowerCase();
        });
        break;
    }
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
      header: [{ text: 'NOTES LIST', style: 'header' }],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
        },
      },
      content: [this.table(this.notesList, ['title', 'status'])],
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
      footer: ['ENd of Note List'],
    };
  }
  buildTableBody(data: any, columns: any) {
    var body = [];
    body.push(columns);
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
  }
}
