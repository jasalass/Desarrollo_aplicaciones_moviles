// src/test.ts
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Inicializar entorno de pruebas de Angular
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);


import './app/login/login.page.spec';
import './app/agregar-producto/agregar-producto.page.spec';
import './app/perfil/perfil.page.spec';
