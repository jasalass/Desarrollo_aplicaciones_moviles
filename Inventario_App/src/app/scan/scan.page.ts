// src/app/scan/scan.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonText } from '@ionic/angular/standalone';
import { ScannerService } from '../services/scannerService/scanner-service';
import { LocalDbService } from '../services/db-local/db-local';

@Component({
  selector: 'app-scan',
  standalone: true,
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  imports: [CommonModule, IonContent, IonButton, IonText],
})
export class ScanPage implements OnInit {
  scannedText: string | null = null;
  allScans: any[] = [];
  scanning = false;

  constructor(
    private scanner: ScannerService,
    private db: LocalDbService
  ) {}

  async ngOnInit() {
    this.allScans = await this.db.getAllScans();
  }

  async startScan() {
    try {
      this.scanning = true;
      const result = await this.scanner.scanOnce();
      if (result) {
        this.scannedText = result;
        await this.db.saveScan(result);
        this.allScans = await this.db.getAllScans(); // refrescar vista
      } else {
        this.scannedText = 'No se leyó contenido';
      }
    } catch (err) {
      this.scannedText = 'Error al escanear';
    } finally {
      this.scanning = false;
      await this.scanner.stop();
    }
  }

  clear() {
    this.scannedText = null;
  }
}
