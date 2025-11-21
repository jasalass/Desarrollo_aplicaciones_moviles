import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButtons,IonContent} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonContent,IonRouterOutlet, IonApp ],
})
export class AppComponent {
  constructor(private router: Router) {}

  goScan() {
    this.router.navigate(['/scan']);
  }

  goAddProduct() {
    this.router.navigate(['/add-product']);
  }

  goSearchProduct() {
    this.router.navigate(['/search-product']);
  }
}
