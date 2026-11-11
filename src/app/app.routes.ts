import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'cadastro',
    pathMatch: 'full',
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/cadastro/cadastro.page').then((m) => m.CadastroPage),
  },
  {
    path: 'diagnostico-inicial',
    loadComponent: () =>
      import('./pages/diagnostico-inicial/diagnostico-inicial.page').then((m) => m.DiagnosticoInicialPage),
  },
  {
    path: 'sua-trilha',
    loadComponent: () =>
      import('./pages/sua-trilha/sua-trilha.page').then((m) => m.SuaTrilhaPage),
  },
  {
    path: 'tutor',
    loadComponent: () =>
      import('./pages/tutor/tutor.page').then((m) => m.TutorPage),
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
];
