import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="onClick.emit($event)"
      [disabled]="disabled || loading"
      class="inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200"
      [ngClass]="[
        sizeClass(),
        variantClass(),
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
      ]"
    >
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class PremiumButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
  
  @Output() onClick = new EventEmitter<MouseEvent>();

  sizeClass() {
    switch (this.size) {
      case 'sm': return 'px-4 py-2 text-xs rounded-xl';
      case 'lg': return 'px-8 py-4 text-base rounded-2xl';
      default: return 'px-6 py-3 text-sm rounded-2xl';
    }
  }

  variantClass() {
    switch (this.variant) {
      case 'secondary':
        return 'bg-white/5 text-text-primary border border-white/10 shadow-inner hover:bg-white/10 hover:border-white/20 active:scale-95';
      case 'danger':
        return 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 active:scale-95';
      case 'ghost':
        return 'bg-transparent text-text-secondary border border-transparent hover:bg-white/5 hover:text-text-primary active:scale-95';
      default:
        // Default Primary: Dark background inside uses bright accent, 
        // Text is dark bg color to contrast. Add a nice glow.
        return 'bg-accent text-bg font-extrabold border border-transparent shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)] hover:brightness-110 active:scale-95';
    }
  }
}
