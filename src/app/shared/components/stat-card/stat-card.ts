import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PremiumCardComponent } from '../premium-card/premium-card';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, PremiumCardComponent],
  template: `
    <app-premium-card [hoverable]="true" [noPadding]="true" class="block w-full">
      <div class="relative overflow-hidden w-full h-full p-5 flex items-center gap-5">
        
        <!-- Ambient background glow behind the icon -->
        <div class="absolute -left-6 -top-6 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40"
             [style.background]="color"></div>

        <!-- Top subtle highlight instead of hard gradient line -->
        <div class="absolute top-0 left-0 right-0 h-[1px] opacity-50"
             [style.background]="'linear-gradient(90deg, ' + color + ' 0%, transparent 100%)'"></div>
        
        <!-- Icon Bubble -->
        <div 
          class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner relative z-10 transition-transform duration-500 group-hover:scale-110"
          [style.background]="color + '15'"
          [style.color]="color"
          [innerHTML]="safeIcon"
        ></div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-[28px] font-extrabold text-text-primary tracking-tight m-0 leading-[1.1] stat-number">
            {{ value }}
          </p>
          <p class="text-xs text-text-secondary mt-1 font-medium truncate">
            {{ label }}
          </p>
        </div>
      </div>
    </app-premium-card>
  `
})
export class StatCardComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() label = '';
  @Input() value: string | number = '';
  @Input() color = '#1d9bf0';
  @Input() icon = '';

  get safeIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }
}
