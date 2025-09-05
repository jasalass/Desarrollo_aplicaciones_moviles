import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonButton, IonInput, FormsModule]
})
export class LoginPage {
  email: string = "";
  password: string = "";
  
  constructor(private router: Router) { }

  ngOnInit() {
    
  }
  onSubmit(){
    console.log(this.email);
    console.log(this.password);
  }

  registro(){
    console.log("registro")
    this.router.navigate(["/registro"])
  }
}
