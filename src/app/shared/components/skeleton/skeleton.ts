import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton"
         [style.width]="width"
         [style.height]="height"
         [style.border-radius]="radius">
    </div>
  `
})
export class SkeletonComponent {
  @Input() width  = '100%';
  @Input() height = '20px';
  @Input() radius = '10px';
}

@Component({
  selector: 'app-stat-card-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="card p-5 space-y-3">
      <app-skeleton width="40%" height="12px"></app-skeleton>
      <app-skeleton width="60%" height="32px"></app-skeleton>
      <app-skeleton width="50%" height="10px"></app-skeleton>
    </div>
  `
})
export class StatCardSkeletonComponent {}

@Component({
  selector: 'app-chart-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="card p-5 space-y-4">
      <app-skeleton width="30%" height="14px"></app-skeleton>
      <app-skeleton width="100%" height="200px" radius="12px"></app-skeleton>
    </div>
  `
})
export class ChartSkeletonComponent {}

@Component({
  selector: 'app-slot-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));">
      @for (i of items; track i) {
        <div class="skeleton" style="height:90px; border-radius:14px;"></div>
      }
    </div>
  `
})
export class SlotSkeletonComponent {
  items = Array(24).fill(0);
}
