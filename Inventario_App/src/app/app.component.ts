import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButtons,
  IonContent,
  IonHeader,
  IonMenu,
  IonMenuButton,
  IonTitle,
  IonToolbar, IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonList} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonButtons,
  IonContent,
  IonHeader,
  IonMenu,
  IonMenuButton,
  IonTitle,
  IonToolbar, IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonList],
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
