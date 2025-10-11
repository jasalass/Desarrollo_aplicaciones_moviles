import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {

  let info_sesion = localStorage.getItem('usuarios') || false;

  const router = inject(Router);
  

  if(!info_sesion){
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }else{
    
    return true;
  }
};
