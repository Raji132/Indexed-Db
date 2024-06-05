import { Component } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public firstName: string;
  public coursename:string;
  public coursedescription:string;
  public lastName: string;
  public birthdate: string;
  public courseid:number;
  public students: { student_id: number, first_name: string, last_name: string, birthdate: string, course_id:number }[];
  public courses :{course_id: number, course_name: string, course_description: string}[];

  constructor(private sqlite: SqliteService) {
    this.firstName = '';
    this.coursename='';
    this.coursedescription='';
    this.lastName = '';
    this.birthdate = '';
    this.courseid;
    this.students = [];
    this.courses=[];
  }

  // When entering, read data from the database
  // ionViewWillEnter() {
  //   this.readStudents();
  // }

  // createStudent() {
  //   // Create a new entry in the database
  //   this.sqlite.createStudent(this.firstName, this.lastName, this.birthdate, this.courseid)
  //     .then(() => {
  //       console.log("Student created");
  //       this.clearFields();
  //       this.readStudents(); // Refresh the list
  //     })
  //     .catch(err => {
  //       console.error("Error creating student:", err);
  //     });
  // }


 }
