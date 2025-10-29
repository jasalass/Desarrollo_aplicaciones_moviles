// src/app/services/local-db.service.ts
import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
  capSQLiteSet
} from '@capacitor-community/sqlite';

type Shelf = { id: string; code: string; name: string; qr_text?: string };
type Product = { id: string; code: string; name: string; description?: string; min_stock: number };

@Injectable({ providedIn: 'root' })
export class LocalDbService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly dbName = 'inventario';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.init();
  }

  // ========= INIT =========
  private async init() {
    const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;
    if (isConn) {
      this.db = await this.sqlite.retrieveConnection(this.dbName, false);
    } else {
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );
    }

    await this.db!.open();
    await this.createSchema();

    // Seed meta_sync
    await this.run(
      `INSERT OR IGNORE INTO meta_sync(key,value) VALUES ('last_pull','1970-01-01T00:00:00.000Z')`
    );

    // Datos de prueba
    await this.seedDevData();
  }

  // ========= SCHEMA =========
  private async createSchema() {
    const schema = `
      create table if not exists meta_sync (
        key text primary key,
        value text
      );

      create table if not exists warehouses (
        id text primary key,
        code text not null unique,
        name text not null,
        address text,
        comments text,
        deleted integer not null default 0,
        created_by text,
        created_at text not null,
        updated_at text not null,
        pending_sync integer not null default 0
      );

      create table if not exists shelves (
        id text primary key,
        warehouse_id text,
        code text not null,
        name text not null,
        area text,
        qr_text text,
        comments text,
        deleted integer not null default 0,
        created_by text,
        created_at text not null,
        updated_at text not null,
        pending_sync integer not null default 0
      );

      create table if not exists products (
        id text primary key,
        code text not null unique,
        name text not null,
        description text,
        min_stock integer not null default 0,
        comments text,
        deleted integer not null default 0,
        created_by text,
        created_at text not null,
        updated_at text not null,
        pending_sync integer not null default 0
      );

      create table if not exists product_locations (
        id text primary key,
        product_id text not null,
        shelf_id   text,
        quantity   integer not null default 0,
        comments   text,
        deleted    integer not null default 0,
        created_by text,
        created_at text not null,
        updated_at text not null,
        pending_sync integer not null default 0,
        unique (product_id, shelf_id)
      );
      create table if not exists scans (
        id text primary key,
        content text not null,
        created_at text not null
      );

      create trigger if not exists trg_wh_upd after update on warehouses
      begin
        update warehouses set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') where id = NEW.id;
      end;

      create trigger if not exists trg_shelves_upd after update on shelves
      begin
        update shelves set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') where id = NEW.id;
      end;

      create trigger if not exists trg_products_upd after update on products
      begin
        update products set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') where id = NEW.id;
      end;

      create trigger if not exists trg_locations_upd after update on product_locations
      begin
        update product_locations set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') where id = NEW.id;
      end;
    `;
    await this.execute(schema);
  }

  // ========= SEED (datos de prueba) =========
  private async seedDevData() {
    const batch = `
      BEGIN;

      DELETE FROM product_locations;
      DELETE FROM products;
      DELETE FROM shelves;
      DELETE FROM warehouses;

      INSERT OR IGNORE INTO warehouses
      (id, code, name, address, comments, deleted, created_by, created_at, updated_at, pending_sync)
      VALUES
      ('W-0001','BOD-NORTE','Bodega Norte','Av. Norte 123','Bodega principal zona norte',0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0),
      ('W-0002','BOD-SUR','Bodega Sur','Camino Sur km 5','Bodega secundaria zona sur',0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0);

      INSERT OR IGNORE INTO shelves
      (id, warehouse_id, code, name, area, qr_text, comments, deleted, created_by, created_at, updated_at, pending_sync)
      VALUES
      ('S-0001','W-0001','A-01','Pasillo A Estante 1','A','QR_BOD-NORTE_A-01','Zona recepción',0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0),
      ('S-0002','W-0001','A-02','Pasillo A Estante 2','A','QR_BOD-NORTE_A-02',NULL,0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0),
      ('S-0003','W-0001','B-01','Pasillo B Estante 1','B','QR_BOD-NORTE_B-01',NULL,0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0),
      ('S-0004','W-0002','A-01','Pasillo A Estante 1','A','QR_BOD-SUR_A-01','Cerca de despacho',0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0),
      ('S-0005','W-0002','C-01','Pasillo C Estante 1','C','QR_BOD-SUR_C-01',NULL,0,'seed',
       '2025-01-01T00:00:00.000Z','2025-01-01T00:00:00.000Z',0);

      INSERT OR IGNORE INTO products
      (id, code, name, description, min_stock, comments, deleted, created_by, created_at, updated_at, pending_sync)
      VALUES
      ('P-1001','P-1001','Alcohol Gel 500ml','Alcohol gel para manos 70%',10,NULL,0,'seed',
       '2025-02-01T00:00:00.000Z','2025-02-01T00:00:00.000Z',0),
      ('P-1002','P-1002','Mascarilla N95','Caja x 20 unidades',20,NULL,0,'seed',
       '2025-02-01T00:00:00.000Z','2025-02-01T00:00:00.000Z',0),
      ('P-1003','P-1003','Guantes Nitrilo M','Caja x 100 unidades',15,'Color azul',0,'seed',
       '2025-02-01T00:00:00.000Z','2025-02-01T00:00:00.000Z',0),
      ('P-1004','P-1004','Suero Fisiológico 500ml','Bolsa 0.9% NaCl',8,NULL,0,'seed',
       '2025-02-01T00:00:00.000Z','2025-02-01T00:00:00.000Z',0),
      ('P-1005','P-1005','Tegaderm 10x12','Apósito transparente estéril',12,NULL,0,'seed',
       '2025-02-01T00:00:00.000Z','2025-02-01T00:00:00.000Z',0);

      INSERT OR IGNORE INTO product_locations
      (id, product_id, shelf_id, quantity, comments, deleted, created_by, created_at, updated_at, pending_sync)
      VALUES
      ('L-0001','P-1001','S-0001',35,'Ingreso reciente',0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),
      ('L-0002','P-1001','S-0004',15,NULL,0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),

      ('L-0003','P-1002','S-0002',80,NULL,0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),

      ('L-0004','P-1003','S-0002',50,'Caja abierta',0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),
      ('L-0005','P-1003','S-0005',40,NULL,0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),

      ('L-0006','P-1004','S-0003',22,NULL,0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),

      ('L-0007','P-1005','S-0001',18,NULL,0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0),
      ('L-0008','P-1005','S-0004',12,'Reserva para despacho',0,'seed',
       '2025-03-01T00:00:00.000Z','2025-03-01T00:00:00.000Z',0);

      COMMIT;
    `;
    await this.execute(batch);
  }

  // ========= UTILIDADES =========
  private nowIso() {
    return new Date().toISOString();
  }
  private genId(prefix: string) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  }

  // ========= SHELVES =========
  async getShelves(): Promise<Shelf[]> {
    return this.query<Shelf>(`
      SELECT id, code, name, qr_text
      FROM shelves
      WHERE deleted = 0
      ORDER BY code
    `);
  }

  async findShelfByQr(qr: string): Promise<Shelf | null> {
    const r = await this.query<Shelf>(
      `SELECT id, code, name, qr_text FROM shelves WHERE qr_text = ? LIMIT 1`,
      [qr]
    );
    return r[0] ?? null;
  }

  // ========= PRODUCTS =========
  /** Inserta si no existe por code; si existe, actualiza nombre/desc/min_stock. Retorna id. */
  async upsertProductByCode(
    code: string,
    name: string,
    description: string | null,
    minStock: number,
    createdBy?: string
  ): Promise<string> {
    const found = await this.query<{ id: string }>(
      `SELECT id FROM products WHERE code = ? LIMIT 1`,
      [code]
    );
    const now = this.nowIso();
    if (found.length) {
      await this.run(
        `UPDATE products
         SET name = ?, description = ?, min_stock = ?, pending_sync = 1
         WHERE id = ?`,
        [name, description, minStock, found[0].id]
      );
      return found[0].id;
    } else {
      const id = this.genId('prd');
      await this.run(
        `INSERT INTO products (id, code, name, description, min_stock, comments, deleted, created_by, created_at, updated_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, NULL, 0, ?, ?, ?, 1)`,
        [id, code, name, description, minStock, createdBy ?? null, now, now]
      );
      return id;
    }
  }

  // ========= LOCATIONS =========
  /** Crea/actualiza ubicación. Si ya existe (product_id,shelf_id) → suma cantidad. */
  async addOrUpdateLocation(
    productId: string,
    shelfId: string,
    qty: number,
    createdBy?: string,
    comments?: string
  ) {
    const existing = await this.query<{ id: string; quantity: number }>(
      `SELECT id, quantity FROM product_locations WHERE product_id = ? AND shelf_id = ? LIMIT 1`,
      [productId, shelfId]
    );
    if (existing.length) {
      await this.run(
        `UPDATE product_locations
         SET quantity = ?, pending_sync = 1
         WHERE id = ?`,
        [existing[0].quantity + qty, existing[0].id]
      );
    } else {
      const id = this.genId('loc');
      const now = this.nowIso();
      await this.run(
        `INSERT INTO product_locations
         (id, product_id, shelf_id, quantity, comments, deleted, created_by, created_at, updated_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 1)`,
        [id, productId, shelfId, qty, comments ?? null, createdBy ?? null, now, now]
      );
    }
  }

  // ========= HELPERS DB =========
  /** Ejecuta 1 sentencia con parámetros */
  async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('DB not ready');
    await this.db.run(sql, params);
  }

  /** Ejecuta múltiples sentencias separadas por ';' */
  async execute(sqlBatch: string): Promise<void> {
    if (!this.db) throw new Error('DB not ready');
    await this.db.execute(sqlBatch);
  }

  /** SELECT con tipado genérico */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('DB not ready');
    const res = await this.db.query(sql, params);
    return res.values ?? [];
  }

  /** Ejecuta un lote de sets nativos */
  async execSet(sets: capSQLiteSet[]): Promise<void> {
    if (!this.db) throw new Error('DB not ready');
    await this.db.executeSet(sets);
  }

  /** Aplica la MISMA sentencia a muchas filas (any[][]). */
  async execSetFromMatrix(stmt: string, rows: any[][]): Promise<void> {
    if (!this.db) throw new Error('DB not ready');
    const sets: capSQLiteSet[] = rows.map(values => ({ statement: stmt, values }));
    await this.db.executeSet(sets);
  }

  // Guarda un nuevo escaneo
  async saveScan(content: string) {
    const id = 'SCAN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date().toISOString();
    await this.run(`INSERT INTO scans (id, content, created_at) VALUES (?, ?, ?)`, [id, content, now]);
  }

  // Devuelve todos los escaneos guardados
  async getAllScans() {
    const sql = `SELECT * FROM scans ORDER BY created_at DESC;`;
    return await this.query(sql);
  }
}
