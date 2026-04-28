import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ParkingService } from '../../core/services/parking.service';
import { RevenueReport, HourlyTraffic, UtilisationStats } from '../../core/models/parking.models';
import { ChartSkeletonComponent, StatCardSkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, ChartSkeletonComponent, StatCardSkeletonComponent],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('380ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="p-6 space-y-6 page-host" @fadeSlideUp>
      <div>
        <h2 style="font-size:22px; font-weight:700; color:var(--text-primary); margin:0;">Analytics</h2>
        <p style="color:var(--text-secondary); font-size:14px; margin:4px 0 0;">Last 30 days · Lot {{ lotId }}</p>
      </div>

      <!-- Revenue + utilisation cards -->
      @if (loading()) {
        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
          @for (i of [1,2,3]; track i) { <app-stat-card-skeleton /> }
        </div>
      } @else if (revenue()) {
        <div class="grid gap-4" @fadeSlideUp
             style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
          <div class="card p-5">
            <p style="font-size:12px; font-weight:500; color:var(--text-secondary); margin:0 0 6px; text-transform:uppercase; letter-spacing:.05em;">Total Revenue</p>
            <p class="stat-number" style="font-size:30px; font-weight:700; color:#6366f1; margin:0;">
              ₹{{ revenue()!.totalRevenue | number:'1.0-0' }}
            </p>
            <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0;">{{ revenue()!.totalTransactions }} transactions</p>
          </div>
          @if (utilisation()) {
            <div class="card p-5">
              <p style="font-size:12px; font-weight:500; color:var(--text-secondary); margin:0 0 6px; text-transform:uppercase; letter-spacing:.05em;">Pre-Bookings</p>
              <p class="stat-number" style="font-size:30px; font-weight:700; color:#10b981; margin:0;">
                {{ utilisation()!.preBookingPct }}%
              </p>
              <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0;">{{ utilisation()!.preBookingCount }} bookings</p>
            </div>
            <div class="card p-5">
              <p style="font-size:12px; font-weight:500; color:var(--text-secondary); margin:0 0 6px; text-transform:uppercase; letter-spacing:.05em;">Walk-Ins</p>
              <p class="stat-number" style="font-size:30px; font-weight:700; color:#f59e0b; margin:0;">
                {{ utilisation()!.walkInPct }}%
              </p>
              <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0;">{{ utilisation()!.walkInCount }} bookings</p>
            </div>
          }
        </div>
      }

      <!-- Charts row -->
      <div class="grid gap-4" style="grid-template-columns: 3fr 2fr;">
        @if (loading()) {
          <app-chart-skeleton />
          <app-chart-skeleton />
        } @else {
          <div class="card p-5" @fadeSlideUp>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin:0 0 16px;">Hourly Traffic</p>
            <canvas #hourly style="max-height:240px;"></canvas>
          </div>

          <div class="card p-5" @fadeSlideUp>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin:0 0 16px;">Booking Type Split</p>
            <canvas #split style="max-height:240px;"></canvas>
          </div>
        }
      </div>

      <!-- No data state -->
      @if (!loading() && !revenue()) {
        <div class="card p-12 flex flex-col items-center text-center" @fadeSlideUp>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5" class="mb-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"/>
          </svg>
          <p style="color:var(--text-secondary); font-size:14px;">No analytics data yet for this lot.</p>
        </div>
      }
    </div>
  `
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('hourly') hourlyRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('split')  splitRef!: ElementRef<HTMLCanvasElement>;

  private analytics = inject(AnalyticsService);
  private parking   = inject(ParkingService);
  private destroy$  = new Subject<void>();

  loading     = signal(true);
  revenue     = signal<RevenueReport | null>(null);
  traffic     = signal<HourlyTraffic[]>([]);
  utilisation = signal<UtilisationStats | null>(null);

  lotId = this.parking.selectedLotId();

  private hourlyChart?: Chart;
  private splitChart?: Chart;

  ngOnInit() {
    const now  = new Date();
    const from = new Date(now.getTime() - 30 * 86400_000);
    const fmt  = (d: Date) => d.toISOString().slice(0,19);

    forkJoin({
      traffic:     this.analytics.getHourlyTraffic(this.lotId, fmt(from), fmt(now)),
      utilisation: this.analytics.getUtilisation(this.lotId, fmt(from), fmt(now)),
      revenue:     this.analytics.getRevenue(this.lotId, fmt(from), fmt(now)),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ traffic, utilisation, revenue }) => {
        this.traffic.set(traffic);
        this.utilisation.set(utilisation);
        this.revenue.set(revenue);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewInit() {}
  ngOnDestroy() {
    this.destroy$.next(); this.destroy$.complete();
    this.hourlyChart?.destroy(); this.splitChart?.destroy();
  }

  private renderCharts() {
    const isDark   = document.documentElement.classList.contains('dark');
    const textClr  = isDark ? '#94a3b8' : '#64748b';
    const gridClr  = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
    const traffic  = this.traffic();
    const util     = this.utilisation();

    // Hourly traffic line chart
    if (this.hourlyRef && traffic.length) {
      this.hourlyChart?.destroy();
      const hours  = traffic.map(t => `${t.hour}:00`);
      const counts = traffic.map(t => t.bookingCount);
      this.hourlyChart = new Chart(this.hourlyRef.nativeElement, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'Bookings',
            data: counts,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,.08)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          }]
        },
        options: {
          animation: { duration: 900, easing: 'easeOutQuart' },
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: textClr, bodyColor: textClr, borderColor: gridClr, borderWidth: 1, padding: 10 }
          },
          scales: {
            x: { grid: { color: gridClr }, ticks: { color: textClr } },
            y: { grid: { color: gridClr }, ticks: { color: textClr }, beginAtZero: true }
          }
        }
      } as ChartConfiguration);
    }

    // Booking type doughnut
    if (this.splitRef && util) {
      this.splitChart?.destroy();
      this.splitChart = new Chart(this.splitRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Pre-Booking', 'Walk-In'],
          datasets: [{
            data: [util.preBookingCount, util.walkInCount],
            backgroundColor: ['rgba(99,102,241,.8)', 'rgba(245,158,11,.8)'],
            borderWidth: 0,
            hoverOffset: 6,
          }]
        },
        options: {
          animation: { animateRotate: true, duration: 900 },
          responsive: true,
          cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { color: textClr, boxWidth: 10, padding: 12 } },
            tooltip: { backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: textClr, bodyColor: textClr }
          }
        }
      } as ChartConfiguration);
    }
  }
}
