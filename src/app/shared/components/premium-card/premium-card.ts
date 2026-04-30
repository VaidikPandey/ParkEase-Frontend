import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-bg-card/40 backdrop-blur-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] relative group"
      [class.shadow-xl]="!noShadow"
      [class.hover:shadow-2xl]="hoverable"
      [class.hover:border-white/10]="hoverable"
      [class.hover:-translate-y-1.5]="hoverable"
      [class.p-6]="!noPadding"
    >
      <ng-content select="[card-header]"></ng-content>
      
      <div [class.mt-4]="hasHeader">
        <ng-content></ng-content>
      </div>

      <ng-content select="[card-footer]"></ng-content>
    </div>
  `
})
export class PremiumCardComponent {
  @Input({ transform: booleanAttribute }) hoverable = false;
  @Input({ transform: booleanAttribute }) noShadow = false;
  @Input({ transform: booleanAttribute }) noPadding = false;
  @Input({ transform: booleanAttribute }) hasHeader = false;
}
