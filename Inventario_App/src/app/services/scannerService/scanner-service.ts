import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScannerService {
  /** Último contenido escaneado (para compartir entre páginas) */
  private _lastScan$ = new BehaviorSubject<string | null>(null);
  lastScan$ = this._lastScan$.asObservable();

  /** Comprueba o solicita permisos de cámara */
  private async ensurePermission() {
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== 'granted') {
      const res = await BarcodeScanner.requestPermissions();
      if (res.camera !== 'granted') throw new Error('Permiso de cámara denegado');
    }
  }

  /** Escanea una sola vez y devuelve el contenido del código */
  async scanOnce(): Promise<string> {
    await this.ensurePermission();

    // Ejecuta la lectura (abre la UI nativa del plugin)
    const { barcodes } = await BarcodeScanner.scan();

    const content = barcodes?.[0]?.rawValue ?? '';
    if (content) this._lastScan$.next(content);
    return content;
  }

  /** Apaga el escáner (solo por compatibilidad con la versión anterior) */
  async stop() {
    // Este plugin no requiere stop manual,
    // pero dejamos el método para no romper el flujo previo.
    this._lastScan$.next(null);
  }

  /** Activa/desactiva linterna (si el dispositivo la soporta) */
  async toggleTorch(on: boolean) {
    try {
      if (on) {
        await BarcodeScanner.enableTorch();
      } else {
        await BarcodeScanner.disableTorch();
      }
    } catch {
      console.warn('Torch no soportada en este dispositivo');
    }
  }

  /** Limpia el último valor escaneado */
  clearLast() {
    this._lastScan$.next(null);
  }


  
}
