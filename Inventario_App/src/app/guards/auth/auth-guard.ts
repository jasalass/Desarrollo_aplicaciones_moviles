// src/app/guards/auth/auth-guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../../services/supabaseService/supabase';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  // cache en memoria para tolerar reanudaciones (resume) y prompts de permisos
  private lastKnownAuth = false;
  // cuánto esperar a que Supabase entregue la sesión (ms)
  private readonly sessionWaitMs = 700;

  constructor(
    private router: Router,
    private sb: SupabaseService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    // 1) consulta “rápida” a la sesión actual
    const { data } = await Promise.race([
      this.sb.supabase.auth.getSession(),
      new Promise<{ data: { session: any | null } }>(res => setTimeout(() => res({ data: { session: null } }), this.sessionWaitMs))
    ]);

    const hasSession = !!data.session;
    if (hasSession) {
      this.lastKnownAuth = true;
      return true;
    }

    // 2) Tolerancia: si veníamos autenticados, permite /scan y rutas hijas “rápidas”
    const url = state.url || '';
    const tolerantRoutes = ['/scan']; // agrega aquí otras rutas sensibles a permisos/cámara si quieres
    if (this.lastKnownAuth && tolerantRoutes.some(p => url.startsWith(p))) {
      return true;
    }

    // 3) Redirige a login con returnUrl
    this.lastKnownAuth = false;
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: url } });
  }
}
