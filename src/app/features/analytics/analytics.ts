import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ParkingService } from '../../core/services/parking.service';
import { AuthService } from '../../core/services/auth.service';
import { ParkingLot, RevenueReport, HourlyTraffic, UtilisationStats } from '../../core/models/parking.models';
import { ChartSkeletonComponent, StatCardSkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { PremiumCardComponent } from '../../shared/components/premium-card/premium-card';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

type Range = '1d' | '15d' | '30d';

const STAT_CARDS = [
  { key: 'revenue',    label: 'Total Revenue',  color: '#6366f1', icon: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
  { key: 'avg',        label: 'Avg / Booking',  color: 'var(--accent)', icon: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/></svg>` },
  { key: 'prebooking', label: 'Pre-Bookings',   color: 'var(--success)', icon: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>` },
  { key: 'walkin',     label: 'Walk-Ins',       color: 'var(--warning)', icon: `<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>` },
];

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, ChartSkeletonComponent, StatCardSkeletonComponent, PremiumCardComponent, StatCardComponent],
  template: `
    <div class="max-w-[1400px] mx-auto p-6 md:p-8 min-h-full pb-20 anim-in">

      <!-- Header -->
      <div class="flex items-end justify-between flex-wrap gap-6 mb-8 pb-6 border-b border-white/5 relative">
        <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-accent/30 to-transparent"></div>
        <div class="relative z-10">
          <h1 class="text-[32px] md:text-[40px] font-extrabold text-text-primary m-0 tracking-tight leading-none drop-shadow-sm">Analytics</h1>
          <p class="text-[15px] text-text-secondary mt-2 font-medium tracking-wide">
            {{ selectedLotName() }} <span class="mx-2 opacity-30">|</span> <span class="text-accent">{{ rangeLabel() }}</span>
          </p>
        </div>
        
        <!-- Range buttons -->
        <div class="flex items-center gap-2 relative z-10 bg-bg-card border border-white/5 p-1 rounded-2xl shadow-inner">
          @for (r of ranges; track r.value) {
            <button (click)="setRange(r.value)"
                    class="text-[12px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-all duration-300"
                    [class.bg-accent]="range() === r.value"
                    [class.text-bg]="range() === r.value"
                    [class.shadow-[0_0_12px_rgba(34,211,238,0.4)]]="range() === r.value"
                    [class.bg-transparent]="range() !== r.value"
                    [class.text-text-secondary]="range() !== r.value"
                    [class.hover:text-text-primary]="range() !== r.value"
                    [class.border-none]="true">
              {{ r.label }}
            </button>
          }
        </div>
      </div>

      <!-- Lot selector -->
      @if (lots().length > 1) {
        <div class="flex items-center gap-2 flex-wrap mb-8">
          @for (lot of lots(); track lot.lotId) {
            <button (click)="setLot(lot.lotId)"
                    class="text-[12px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 border"
                    [class.bg-accent/10]="activeLotId() === lot.lotId"
                    [class.text-accent]="activeLotId() === lot.lotId"
                    [class.border-accent/30]="activeLotId() === lot.lotId"
                    [class.shadow-[0_0_10px_rgba(34,211,238,0.1)]]="activeLotId() === lot.lotId"
                    [class.bg-white_5]="activeLotId() !== lot.lotId"
                    [class.text-text-secondary]="activeLotId() !== lot.lotId"
                    [class.border-white_5]="activeLotId() !== lot.lotId"
                    [class.hover:bg-white_10]="activeLotId() !== lot.lotId"
                    [class.hover:text-text-primary]="activeLotId() !== lot.lotId">
              {{ lot.name }}
            </button>
          }
        </div>
      }

      <!-- Stat cards -->
      @if (loading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          @for (i of [1,2,3,4]; track i) { <app-stat-card-skeleton /> }
        </div>
      } @else if (revenue()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 anim-in anim-d1">
          <app-stat-card label="Total Revenue" [value]="'₹' + (revenue()!.totalRevenue | number:'1.0-0')" color="#6366f1" [icon]="statCards[0].icon" />
          <app-stat-card label="Avg / Booking" [value]="'₹' + (revenue()!.totalTransactions ? (revenue()!.totalRevenue / revenue()!.totalTransactions | number:'1.0-0') : 0)" color="var(--accent)" [icon]="statCards[1].icon" />
          @if (utilisation()) {
            <app-stat-card label="Pre-Bookings" [value]="utilisation()!.preBookingPct + '%'" color="var(--success)" [icon]="statCards[2].icon" />
            <app-stat-card label="Walk-Ins" [value]="utilisation()!.walkInPct + '%'" color="var(--warning)" [icon]="statCards[3].icon" />
          }
        </div>
      }

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 anim-in anim-d2">
        @if (loading()) {
          <div class="lg:col-span-8"><app-chart-skeleton /></div>
          <div class="lg:col-span-4"><app-chart-skeleton /></div>
        } @else {
          
          <app-premium-card class="lg:col-span-8">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-2.5 h-2.5 rounded-full bg-accent pulse-dot"></span>
              <p class="text-[16px] font-bold text-text-primary tracking-tight m-0">Hourly Traffic</p>
            </div>
            <div class="relative w-full">
              <!-- Glow behind chart -->
              <div class="absolute inset-0 bg-accent/5 blur-[50px] pointer-events-none"></div>
              <canvas #hourly style="max-height:280px; position: relative; z-index: 10;"></canvas>
            </div>
          </app-premium-card>

          <app-premium-card class="lg:col-span-4 flex flex-col justify-center items-center">
            <p class="text-[16px] font-bold text-text-primary tracking-tight m-0 mb-6 w-full text-left">Booking Type Split</p>
            <div class="relative w-full max-w-[280px] mx-auto">
              <!-- Glow behind chart -->
              <div class="absolute inset-0 bg-warning/5 blur-[40px] pointer-events-none"></div>
              <canvas #split style="max-height:280px; position: relative; z-index: 10;"></canvas>
            </div>
          </app-premium-card>

        }
      </div>

      <!-- Empty state -->
      @if (!loading() && !revenue()) {
        <app-premium-card class="text-center mt-6 anim-in anim-d1 opacity-60">
          <div class="w-16 h-16 mx-auto rounded-full bg-text-secondary/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"/>
            </svg>
          </div>
          <p class="text-[18px] font-bold text-text-primary m-0 mb-2">No analytics data yet</p>
          <p class="text-[14px] text-text-secondary m-0">Try a different lot or date range.</p>
        </app-premium-card>
      }

    </div>
  `
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('hourly') hourlyRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('split')  splitRef!: ElementRef<HTMLCanvasElement>;

  private analytics = inject(AnalyticsService);
  private parking   = inject(ParkingService);
  private auth      = inject(AuthService);
  private destroy$  = new Subject<void>();

  readonly statCards = STAT_CARDS;

  loading     = signal(true);
  revenue     = signal<RevenueReport | null>(null);
  traffic     = signal<HourlyTraffic[]>([]);
  utilisation = signal<UtilisationStats | null>(null);
  lots        = signal<ParkingLot[]>([]);
  activeLotId = signal<number>(this.parking.selectedLotId());
  range       = signal<Range>('30d');

  ranges = [
    { label: 'Today',   value: '1d'  as Range },
    { label: '15 Days', value: '15d' as Range },
    { label: '30 Days', value: '30d' as Range },
  ];

  selectedLotName = () => this.lots().find(l => l.lotId === this.activeLotId())?.name ?? `Lot ${this.activeLotId()}`;
  rangeLabel      = () => this.ranges.find(r => r.value === this.range())?.label ?? '';

  private hourlyChart?: Chart;
  private splitChart?: Chart;

  ngOnInit() {
    const role = this.auth.currentUser()?.role;
    const lots$ = role === 'ADMIN' ? this.parking.getLots() : this.parking.getManagerLots();

    lots$.pipe(takeUntil(this.destroy$)).subscribe({
      next: lots => {
        this.lots.set(lots);
        const first = lots[0];
        if (first) {
          this.activeLotId.set(first.lotId);
          this.parking.selectedLotId.set(first.lotId);
        }
        this.loadData();
      },
      error: () => this.loadData()
    });
  }

  ngAfterViewInit() {}
  ngOnDestroy() {
    this.destroy$.next(); this.destroy$.complete();
    this.hourlyChart?.destroy(); this.splitChart?.destroy();
  }

  setRange(r: Range) { this.range.set(r); this.loadData(); }
  setLot(lotId: number) { this.activeLotId.set(lotId); this.parking.selectedLotId.set(lotId); this.loadData(); }

  private loadData() {
    this.loading.set(true);
    this.hourlyChart?.destroy();
    this.splitChart?.destroy();

    const days = this.range() === '1d' ? 1 : this.range() === '15d' ? 15 : 30;
    const now  = new Date();
    const from = new Date(now.getTime() - days * 86_400_000);
    const fmt  = (d: Date) => d.toISOString().slice(0, 19);
    const id   = this.activeLotId();

    forkJoin({
      traffic:     this.analytics.getHourlyTraffic(id, fmt(from), fmt(now)),
      utilisation: this.analytics.getUtilisation(id, fmt(from), fmt(now)),
      revenue:     this.analytics.getRevenue(id, fmt(from), fmt(now)),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ traffic, utilisation, revenue }) => {
        this.traffic.set(traffic);
        this.utilisation.set(utilisation);
        this.revenue.set(revenue);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 80);
      },
      error: () => { this.revenue.set(null); this.loading.set(false); }
    });
  }

  private renderCharts() {
    const textClr = '#71767b';
    const gridClr = 'rgba(255,255,255,.06)';
    const traffic = this.traffic();
    const util    = this.utilisation();

    if (this.hourlyRef?.nativeElement && traffic.length) {
      this.hourlyChart?.destroy();
      this.hourlyChart = new Chart(this.hourlyRef.nativeElement, {
        type: 'line',
        data: {
          labels: traffic.map(t => `${t.hour}:00`),
          datasets: [{
            label: 'Bookings',
            data: traffic.map(t => t.bookingCount),
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
          animation: { duration: 700, easing: 'easeOutQuart' },
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#0f0f0f', titleColor: textClr, bodyColor: textClr, borderColor: gridClr, borderWidth: 1, padding: 10 }
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: textClr, font: { family: 'Inter', weight: 'bold' } } },
            y: { grid: { display: false }, border: { display: false }, ticks: { color: textClr, font: { family: 'Inter', weight: 'bold' }, stepSize: 1, precision: 0 }, beginAtZero: true }
          }
        }
      } as ChartConfiguration);
    }

    if (this.splitRef?.nativeElement && util) {
      this.splitChart?.destroy();
      this.splitChart = new Chart(this.splitRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Pre-Booking', 'Walk-In'],
          datasets: [{
            data: [util.preBookingCount, util.walkInCount],
            backgroundColor: ['rgba(99,102,241,.85)', 'rgba(255,212,0,.85)'],
            borderWidth: 0,
            hoverOffset: 6,
          }]
        },
        options: {
          animation: { animateRotate: true, duration: 700 },
          responsive: true,
          cutout: '72%',
          plugins: {
            legend: { position: 'bottom', labels: { color: textClr, font: { family: 'Inter', weight: 'bold' }, boxWidth: 10, padding: 14 } },
            tooltip: { backgroundColor: '#0f0f0f', titleColor: textClr, bodyColor: textClr, padding: 12, borderWidth: 1, borderColor: gridClr }
          }
        }
      } as ChartConfiguration);
    }
  }
}
