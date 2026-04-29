import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(localStorage.getItem('theme') !== 'light');

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('light', !dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
    document.documentElement.classList.toggle('light', !this.isDark());
  }

  toggle(): void {
    this.isDark.update(d => !d);
  }
}
