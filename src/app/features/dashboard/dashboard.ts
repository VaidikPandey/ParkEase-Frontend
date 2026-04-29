import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../core/services/parking.service';
import { DashboardStats, ParkingSpot } from '../../core/models/parking.models';
import { StatCardSkeletonComponent, ChartSkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardSkeletonComponent, ChartSkeletonComponent],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(80, animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="p-6 space-y-6 page-host" @fadeSlideUp>

      <!-- Header -->
      <div>
        <h2 style="font-size:22px; font-weight:700; color:var(--text-primary); margin:0;">Overview</h2>
        <p style="color:var(--text-secondary); font-size:14px; margin:4px 0 0;">
          Live stats · updates every 15 s
        </p>
      </div>

      <!-- Stat Cards -->
      @if (loading()) {
        <div class="grid grid-cols-2 gap-4" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
          @for (i of [1,2,3,4]; track i) { <app-stat-card-skeleton /> }
        </div>
      } @else {
        <div class="grid gap-4" [@staggerCards]="stats()?.totalSpots"
             style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
          @for (card of statCards(); track card.label) {
            <div class="card p-5 cursor-default"
                 style="transition: transform 220ms ease, box-shadow 220ms ease;"
                 onmouseenter="this.style.transform='translateY(-3px)'"
                 onmouseleave="this.style.transform='translateY(0)'">
              <p style="font-size:12px; font-weight:500; color:var(--text-secondary); margin:0 0 6px; text-transform:uppercase; letter-spacing:.05em;">
                {{ card.label }}
              </p>
              <p class="stat-number" style="font-size:32px; font-weight:700; margin:0; line-height:1.1;"
                 [style.color]="card.color">
                {{ card.displayValue }}
              </p>
              <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0;">
                {{ card.sub }}
              </p>
            </div>
          }
        </div>
      }

      <!-- Charts row -->
      <div class="grid gap-4" style="grid-template-columns: 2fr 1fr;">
        <!-- Occupancy bar chart -->
        @if (loading()) {
          <app-chart-skeleton />
        } @else {
          <div class="card p-5" @fadeSlideUp>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin:0 0 16px;">Slot Status Breakdown</p>
            <canvas #barChart style="max-height:220px;"></canvas>
          </div>
        }

        <!-- Doughnut chart -->
        @if (loading()) {
          <app-chart-skeleton />
        } @else {
          <div class="card p-5 flex flex-col items-center" @fadeSlideUp>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin:0 0 16px; align-self:flex-start;">Occupancy Rate</p>
            <canvas #doughnut style="max-height:180px; max-width:180px;"></canvas>
            <p class="stat-number" style="font-size:28px; font-weight:700; color:var(--accent); margin:12px 0 0;">
              {{ stats()?.occupancyRate }}%
            </p>
            <p style="font-size:12px; color:var(--text-secondary); margin:2px 0 0;">occupied</p>
          </div>
        }
      </div>

      <!-- Recent activity strip -->
      @if (!loading() && spots().length) {
        <div class="card p-5" @fadeSlideUp>
          <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin:0 0 14px;">Recent Slot Activity</p>
          <div class="space-y-2">
            @for (spot of recentSpots(); track spot.spotId) {
              <div class="flex items-center justify-between py-2 px-3 rounded-xl"
                   style="background:var(--bg-secondary);">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full flex-shrink-0"
                       [style.background]="statusColor(spot.status)"></div>
                  <span style="font-size:13px; font-weight:500; color:var(--text-primary);">
                    Slot {{ spot.spotNumber }}
                  </span>
                  <span style="font-size:12px; color:var(--text-secondary);">Floor {{ spot.floor }}</span>
                </div>
                <span class="px-2 py-0.5 rounded-lg text-xs font-semibold"
                      [style.background]="statusBg(spot.status)"
                      [style.color]="statusColor(spot.status)">
                  {{ spot.status }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnut') doughnutRef!: ElementRef<HTMLCanvasElement>;

  private parking = inject(ParkingService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  stats   = signal<DashboardStats | null>(null);
  spots   = signal<ParkingSpot[]>([]);

  private barChart?: Chart;
  private doughnut?: Chart;

  ngOnInit() {
    this.parking.pollSpots(this.parking.selectedLotId()).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: spots => {
        this.spots.set(spots);
        this.stats.set(this.parking.getDashboardStats(spots));
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.barChart?.destroy();
    this.doughnut?.destroy();
  }

  statCards() {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total Slots',     displayValue: s.totalSpots,     color: 'var(--text-primary)', sub: 'All parking spots' },
      { label: 'Available',       displayValue: s.availableSpots, color: '#10b981',              sub: 'Ready to book'     },
      { label: 'Occupied',        displayValue: s.occupiedSpots,  color: '#ef4444',              sub: 'Currently in use'  },
      { label: 'Reserved',        displayValue: s.reservedSpots,  color: '#f59e0b',              sub: 'Booked ahead'      },
    ];
  }

  recentSpots() { return this.spots().slice(0, 6); }

  statusColor(s: string) {
    return s === 'AVAILABLE' ? '#10b981' : s === 'OCCUPIED' ? '#ef4444' : '#f59e0b';
  }
  statusBg(s: string) {
    return s === 'AVAILABLE' ? 'rgba(16,185,129,.1)' : s === 'OCCUPIED' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)';
  }

  private renderCharts() {
    const s = this.stats();
    if (!s) return;
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Bar chart
    if (this.barChartRef) {
      this.barChart?.destroy();
      this.barChart = new Chart(this.barChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Available', 'Reserved', 'Occupied'],
          datasets: [{
            data: [s.availableSpots, s.reservedSpots, s.occupiedSpots],
            backgroundColor: ['rgba(16,185,129,.7)', 'rgba(245,158,11,.7)', 'rgba(239,68,68,.7)'],
            borderColor:     ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          animation: { duration: 800, easing: 'easeOutQuart' },
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1, precision: 0 }, beginAtZero: true }
          }
        }
      } as ChartConfiguration);
    }

    // Doughnut
    if (this.doughnutRef) {
      this.doughnut?.destroy();
      this.doughnut = new Chart(this.doughnutRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Available', 'Reserved', 'Occupied'],
          datasets: [{
            data: [s.availableSpots, s.reservedSpots, s.occupiedSpots],
            backgroundColor: ['rgba(16,185,129,.8)', 'rgba(245,158,11,.8)', 'rgba(239,68,68,.8)'],
            borderWidth: 0,
            hoverOffset: 6,
          }]
        },
        options: {
          animation: { animateRotate: true, duration: 900 },
          responsive: true,
          cutout: '72%',
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, boxWidth: 10, padding: 12 } }
          }
        }
      } as ChartConfiguration);
    }
  }
}
