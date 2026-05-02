import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ParkingService } from '../../core/services/parking.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import {
  ParkingLot,
  RevenueReport,
  HourlyTraffic,
  UtilisationStats,
  DriverAnalytics,
  Booking,
} from '../../core/models/parking.models';
import {
  ChartSkeletonComponent,
  StatCardSkeletonComponent,
} from '../../shared/components/skeleton/skeleton';
import { PremiumCardComponent } from '../../shared/components/premium-card/premium-card';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

type Range = '1d' | '15d' | '30d';

const ICON_REVENUE = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
const ICON_CHART = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/></svg>`;
const ICON_CALENDAR = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>`;
const ICON_WALKIN = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>`;
const ICON_CLOCK = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
const ICON_CHECK = `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ChartSkeletonComponent,
    StatCardSkeletonComponent,
    PremiumCardComponent,
    StatCardComponent,
  ],
  template: `
    <div
      style="max-width:1400px;margin:0 auto;padding:28px 24px;min-height:100%;padding-bottom:80px;"
      class="anim-in"
    >
      <!-- Header -->
      <div
        style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:20px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.05);position:relative;"
      >
        <div
          style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(29,155,240,.3),transparent);"
        ></div>
        <div style="position:relative;z-index:1;">
          <h1
            style="font-size:clamp(28px,4vw,38px);font-weight:900;color:#e7e9ea;margin:0;letter-spacing:-.5px;line-height:1;"
          >
            Analytics
          </h1>
          <p style="font-size:14px;color:#71767b;margin:6px 0 0;font-weight:500;">
            @if (isDriver()) {
              Your parking activity ·
            } @else {
              {{ selectedLotName() }} ·
            }
            <span style="color:#1d9bf0;">{{ rangeLabel() }}</span>
          </p>
        </div>
        <!-- Range toggle -->
        <div
          style="display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:4px;gap:4px;position:relative;z-index:1;"
        >
          @for (r of ranges; track r.value) {
            <button
              (click)="setRange(r.value)"
              style="padding:7px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all 150ms;"
              [style.background]="range() === r.value ? '#1d9bf0' : 'transparent'"
              [style.color]="range() === r.value ? '#fff' : '#71767b'"
            >
              {{ r.label }}
            </button>
          }
        </div>
      </div>

      <!-- ──────────────────────────────────────────────
           ADMIN / MANAGER VIEW
      ────────────────────────────────────────────── -->
      @if (!isDriver()) {
        <!-- Lot pills -->
        @if (lots().length > 1) {
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
            @for (lot of lots(); track lot.lotId) {
              <button
                (click)="setLot(lot.lotId)"
                style="font-size:12px;font-weight:700;padding:6px 16px;border-radius:9999px;cursor:pointer;transition:all 150ms;"
                [style.background]="
                  activeLotId() === lot.lotId ? 'rgba(29,155,240,.15)' : 'rgba(255,255,255,.04)'
                "
                [style.color]="activeLotId() === lot.lotId ? '#1d9bf0' : '#71767b'"
                [style.border]="
                  activeLotId() === lot.lotId
                    ? '1px solid rgba(29,155,240,.35)'
                    : '1px solid rgba(255,255,255,.07)'
                "
              >
                {{ lot.name }}
              </button>
            }
          </div>
        }

        <!-- Stat cards -->
        @if (loading()) {
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;"
          >
            @for (i of [1, 2, 3, 4]; track i) {
              <app-stat-card-skeleton />
            }
          </div>
        } @else {
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;"
            class="anim-in anim-d1"
          >
            <app-stat-card
              label="Total Revenue"
              [value]="revenue() ? '₹' + (revenue()!.totalRevenue | number: '1.0-0') : '—'"
              color="#6366f1"
              [icon]="ICON_REVENUE"
            />
            <app-stat-card
              label="Avg / Booking"
              [value]="
                revenue() && revenue()!.totalTransactions
                  ? '₹' + (revenue()!.totalRevenue / revenue()!.totalTransactions | number: '1.0-0')
                  : '—'
              "
              color="#1d9bf0"
              [icon]="ICON_CHART"
            />
            <app-stat-card
              label="Pre-Bookings"
              [value]="utilisation() ? utilisation()!.preBookingPct + '%' : '—'"
              color="#00ba7c"
              [icon]="ICON_CALENDAR"
            />
            <app-stat-card
              label="Walk-Ins"
              [value]="utilisation() ? utilisation()!.walkInPct + '%' : '—'"
              color="#ffd400"
              [icon]="ICON_WALKIN"
            />
          </div>
        }

        <!-- Charts -->
        @if (loading()) {
          <div style="display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:24px;">
            <app-chart-skeleton />
            <app-chart-skeleton />
          </div>
        } @else {
          <div
            style="display:grid;grid-template-columns:1fr 360px;gap:20px;margin-bottom:24px;"
            class="anim-in anim-d2"
          >
            <!-- Hourly Traffic -->
            <app-premium-card>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                <span
                  style="width:8px;height:8px;border-radius:50%;background:#6366f1;display:block;box-shadow:0 0 8px #6366f1;"
                ></span>
                <p
                  style="font-size:15px;font-weight:800;color:#e7e9ea;margin:0;letter-spacing:-.2px;"
                >
                  Hourly Traffic
                </p>
                <span style="margin-left:auto;font-size:11px;color:#71767b;font-weight:600;"
                  >Bookings per hour · {{ rangeLabel() }}</span
                >
              </div>
              @if (traffic().length === 0) {
                <div
                  style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;gap:10px;"
                >
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="rgba(255,255,255,.15)"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                    />
                  </svg>
                  <p style="font-size:13px;color:#536471;margin:0;font-weight:600;">
                    No booking data for this period
                  </p>
                </div>
              }
              <div
                [style.display]="traffic().length ? 'block' : 'none'"
                style="position:relative;width:100%;height:320px;"
              >
                <canvas #hourly style="width:100% !important;height:100% !important;"></canvas>
              </div>
            </app-premium-card>

            <!-- Booking Type Split -->
            <app-premium-card>
              <p
                style="font-size:15px;font-weight:800;color:#e7e9ea;margin:0 0 20px;letter-spacing:-.2px;"
              >
                Booking Split
              </p>
              @if (!utilisation() || utilisation()!.total === 0) {
                <div
                  style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;gap:10px;"
                >
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="rgba(255,255,255,.15)"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                    />
                  </svg>
                  <p style="font-size:13px;color:#536471;margin:0;font-weight:600;">
                    No booking data yet
                  </p>
                </div>
              }
              <div
                [style.display]="utilisation() && utilisation()!.total > 0 ? 'flex' : 'none'"
                style="flex-direction:column;align-items:center;"
              >
                <div
                  style="position:relative;width:100%;max-width:240px;height:240px;margin:0 auto;"
                >
                  <canvas #split style="width:100% !important;height:100% !important;"></canvas>
                </div>
                <!-- legend -->
                <div style="display:flex;gap:20px;margin-top:16px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span
                      style="width:10px;height:10px;border-radius:50%;background:rgba(99,102,241,.85);display:block;"
                    ></span>
                    <span style="font-size:12px;color:#71767b;font-weight:600;"
                      >Pre-Book {{ utilisation()?.preBookingPct }}%</span
                    >
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span
                      style="width:10px;height:10px;border-radius:50%;background:rgba(255,212,0,.85);display:block;"
                    ></span>
                    <span style="font-size:12px;color:#71767b;font-weight:600;"
                      >Walk-In {{ utilisation()?.walkInPct }}%</span
                    >
                  </div>
                </div>
              </div>
            </app-premium-card>
          </div>
        }

        <!-- Recent Activity Section -->
        <div style="margin-top:32px;" class="anim-in anim-d3">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:0 8px;">
            <div
              style="width:10px;height:10px;border-radius:50%;background:#00ba7c;box-shadow:0 0 8px #00ba7c;"
            ></div>
            <h2 style="font-size:18px;font-weight:800;color:#e7e9ea;margin:0;">Recent Activity</h2>
            <span style="font-size:12px;color:#71767b;font-weight:600;margin-left:auto;"
              >{{ recentBookings().length }} records shown</span
            >
          </div>
          <app-premium-card [noPadding]="true">
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;min-width:700px;">
                <thead>
                  <tr style="border-bottom:1px solid rgba(255,255,255,.06);">
                    <th
                      style="text-align:left;padding:16px 20px;font-size:11px;font-weight:700;color:#71767b;text-transform:uppercase;letter-spacing:.05em;"
                    >
                      Spot
                    </th>
                    <th
                      style="text-align:left;padding:16px 20px;font-size:11px;font-weight:700;color:#71767b;text-transform:uppercase;letter-spacing:.05em;"
                    >
                      Vehicle
                    </th>
                    <th
                      style="text-align:left;padding:16px 20px;font-size:11px;font-weight:700;color:#71767b;text-transform:uppercase;letter-spacing:.05em;"
                    >
                      Type
                    </th>
                    <th
                      style="text-align:left;padding:16px 20px;font-size:11px;font-weight:700;color:#71767b;text-transform:uppercase;letter-spacing:.05em;"
                    >
                      Time
                    </th>
                    <th
                      style="text-align:left;padding:16px 20px;font-size:11px;font-weight:700;color:#71767b;text-transform:uppercase;letter-spacing:.05em;"
                    >
                      Status
                    </th>
                    <th
                      style="text-align:right;padding:16px 20px;font-size:11px;font-weight:700;color:#71767b;text-transform:uppercase;letter-spacing:.05em;"
                    >
                      Fare
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of recentBookings(); track b.bookingId) {
                    <tr
                      style="border-bottom:1px solid rgba(255,255,255,.03);transition:background 150ms;"
                      onmouseenter="this.style.background='rgba(255,255,255,.01)'"
                      onmouseleave="this.style.background='transparent'"
                    >
                      <td style="padding:16px 20px;">
                        <span style="font-size:14px;font-weight:700;color:#e7e9ea;"
                          >#{{ b.spotNumber }}</span
                        >
                      </td>
                      <td style="padding:16px 20px;">
                        <span
                          style="font-size:12px;font-weight:800;background:rgba(29,155,240,.1);color:#1d9bf0;padding:3px 8px;border-radius:6px;font-family:monospace;"
                          >{{ b.vehiclePlate }}</span
                        >
                      </td>
                      <td style="padding:16px 20px;">
                        <span style="font-size:12px;color:#71767b;font-weight:600;">{{
                          b.bookingType === 'PRE_BOOKING' ? 'Pre-Book' : 'Walk-In'
                        }}</span>
                      </td>
                      <td style="padding:16px 20px;">
                        <div style="display:flex;flex-direction:column;">
                          <span style="font-size:13px;color:#e7e9ea;font-weight:600;">{{
                            b.startTime | date: 'HH:mm'
                          }}</span>
                          <span style="font-size:11px;color:#71767b;">{{
                            b.startTime | date: 'MMM d, y'
                          }}</span>
                        </div>
                      </td>
                      <td style="padding:16px 20px;">
                        <span
                          style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;padding:4px 8px;border-radius:6px;"
                          [style.background]="statusBg(b.status)"
                          [style.color]="statusColor(b.status)"
                          >{{ b.status }}</span
                        >
                      </td>
                      <td style="padding:16px 20px;text-align:right;">
                        <span style="font-size:14px;font-weight:800;color:#e7e9ea;">{{
                          b.totalFare ? '₹' + b.totalFare : '—'
                        }}</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" style="padding:48px 24px;text-align:center;">
                        <p style="font-size:14px;color:#71767b;margin:0;">
                          No recent activity found for this lot.
                        </p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-premium-card>
        </div>
      }

      <!-- ──────────────────────────────────────────────
           DRIVER VIEW
      ────────────────────────────────────────────── -->
      @if (isDriver()) {
        @if (loading()) {
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;"
          >
            @for (i of [1, 2, 3, 4]; track i) {
              <app-stat-card-skeleton />
            }
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <app-chart-skeleton /> <app-chart-skeleton />
          </div>
        } @else if (driverData()) {
          <!-- Driver stat cards -->
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;"
            class="anim-in anim-d1"
          >
            <app-stat-card
              label="Total Bookings"
              [value]="driverData()!.totalBookings + ''"
              color="#6366f1"
              [icon]="ICON_CALENDAR"
            />
            <app-stat-card
              label="Total Spent"
              [value]="'₹' + (driverData()!.totalSpent | number: '1.0-0')"
              color="#1d9bf0"
              [icon]="ICON_REVENUE"
            />
            <app-stat-card
              label="Hours Parked"
              [value]="
                driverData()!.totalDurationMinutes > 0
                  ? (driverData()!.totalDurationMinutes / 60 | number: '1.1-1') + 'h'
                  : '0h'
              "
              color="#00ba7c"
              [icon]="ICON_CLOCK"
            />
            <app-stat-card
              label="Completed"
              [value]="driverData()!.completedBookings + ''"
              color="#ffd400"
              [icon]="ICON_CHECK"
            />
          </div>

          <div
            style="display:grid;grid-template-columns:340px 1fr;gap:20px;"
            class="anim-in anim-d2"
          >
            <!-- Booking type doughnut -->
            <app-premium-card>
              <p
                style="font-size:15px;font-weight:800;color:#e7e9ea;margin:0 0 20px;letter-spacing:-.2px;"
              >
                Booking Split
              </p>
              @if (driverData()!.totalBookings === 0) {
                <div
                  style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;gap:10px;"
                >
                  <p style="font-size:13px;color:#536471;margin:0;font-weight:600;">
                    No bookings in this period
                  </p>
                </div>
              }
              <div
                [style.display]="driverData()!.totalBookings > 0 ? 'flex' : 'none'"
                style="flex-direction:column;align-items:center;"
              >
                <div style="position:relative;width:100%;max-width:220px;height:220px;margin:0 auto;">
                  <canvas #driverSplit style="width:100% !important;height:100% !important;"></canvas>
                </div>
                <div style="display:flex;gap:20px;margin-top:16px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span
                      style="width:10px;height:10px;border-radius:50%;background:rgba(99,102,241,.85);display:block;"
                    ></span>
                    <span style="font-size:12px;color:#71767b;font-weight:600;"
                      >Pre-Book {{ driverData()!.preBookingPct }}%</span
                    >
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span
                      style="width:10px;height:10px;border-radius:50%;background:rgba(255,212,0,.85);display:block;"
                    ></span>
                    <span style="font-size:12px;color:#71767b;font-weight:600;"
                      >Walk-In {{ driverData()!.walkInPct }}%</span
                    >
                  </div>
                </div>
              </div>
            </app-premium-card>

            <!-- Activity breakdown -->
            <app-premium-card>
              <p
                style="font-size:15px;font-weight:800;color:#e7e9ea;margin:0 0 24px;letter-spacing:-.2px;"
              >
                Activity Breakdown
              </p>
              <div style="display:flex;flex-direction:column;gap:20px;">
                <!-- Pre-booking bar -->
                <div>
                  <div
                    style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;"
                  >
                    <span style="font-size:13px;font-weight:700;color:#e7e9ea;">Pre-Bookings</span>
                    <span style="font-size:13px;font-weight:700;color:#6366f1;">{{
                      driverData()!.preBookingCount
                    }}</span>
                  </div>
                  <div
                    style="height:6px;background:rgba(255,255,255,.06);border-radius:9999px;overflow:hidden;"
                  >
                    <div
                      style="height:100%;border-radius:9999px;background:linear-gradient(90deg,#6366f1,#818cf8);transition:width 700ms ease;"
                      [style.width]="driverData()!.preBookingPct + '%'"
                    ></div>
                  </div>
                </div>

                <!-- Walk-in bar -->
                <div>
                  <div
                    style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;"
                  >
                    <span style="font-size:13px;font-weight:700;color:#e7e9ea;">Walk-Ins</span>
                    <span style="font-size:13px;font-weight:700;color:#ffd400;">{{
                      driverData()!.walkInCount
                    }}</span>
                  </div>
                  <div
                    style="height:6px;background:rgba(255,255,255,.06);border-radius:9999px;overflow:hidden;"
                  >
                    <div
                      style="height:100%;border-radius:9999px;background:linear-gradient(90deg,#ffd400,#ffe066);transition:width 700ms ease;"
                      [style.width]="driverData()!.walkInPct + '%'"
                    ></div>
                  </div>
                </div>

                <!-- Metric tiles -->
                <div
                  style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:4px;"
                >
                  <div
                    style="padding:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;"
                  >
                    <p
                      style="font-size:10px;color:#71767b;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px;"
                    >
                      Avg Duration
                    </p>
                    <p style="font-size:22px;font-weight:900;color:#e7e9ea;margin:0;line-height:1;">
                      {{
                        driverData()!.completedBookings > 0
                          ? (driverData()!.totalDurationMinutes / driverData()!.completedBookings
                            | number: '1.0-0')
                          : '—'
                      }}<span style="font-size:12px;font-weight:600;color:#71767b;"> min</span>
                    </p>
                  </div>
                  <div
                    style="padding:14px;background:rgba(244,33,46,.04);border:1px solid rgba(244,33,46,.1);border-radius:12px;"
                  >
                    <p
                      style="font-size:10px;color:#71767b;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px;"
                    >
                      Cancelled
                    </p>
                    <p style="font-size:22px;font-weight:900;color:#f4212e;margin:0;line-height:1;">
                      {{ driverData()!.cancelledBookings }}
                    </p>
                  </div>
                  <div
                    style="padding:14px;background:rgba(29,155,240,.04);border:1px solid rgba(29,155,240,.1);border-radius:12px;"
                  >
                    <p
                      style="font-size:10px;color:#71767b;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px;"
                    >
                      Avg Cost
                    </p>
                    <p style="font-size:22px;font-weight:900;color:#1d9bf0;margin:0;line-height:1;">
                      {{
                        driverData()!.completedBookings > 0
                          ? '₹' +
                            (driverData()!.totalSpent / driverData()!.completedBookings
                              | number: '1.0-0')
                          : '—'
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </app-premium-card>
          </div>
        } @else {
          <app-premium-card class="text-center" style="padding:56px 24px;">
            <svg
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="rgba(255,255,255,.15)"
              stroke-width="1.5"
              style="margin:0 auto 16px;display:block;"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p style="font-size:16px;font-weight:700;color:#e7e9ea;margin:0 0 6px;">
              No bookings found
            </p>
            <p style="font-size:13px;color:#71767b;margin:0;">Try a wider date range.</p>
          </app-premium-card>
        }
      }
    </div>
  `,
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild('hourly') hourlyRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('split') splitRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('driverSplit') driverSplitRef!: ElementRef<HTMLCanvasElement>;

  private analytics = inject(AnalyticsService);
  private parking = inject(ParkingService);
  private auth = inject(AuthService);
  private booking = inject(BookingService);
  private destroy$ = new Subject<void>();

  readonly ICON_REVENUE = ICON_REVENUE;
  readonly ICON_CHART = ICON_CHART;
  readonly ICON_CALENDAR = ICON_CALENDAR;
  readonly ICON_WALKIN = ICON_WALKIN;
  readonly ICON_CLOCK = ICON_CLOCK;
  readonly ICON_CHECK = ICON_CHECK;

  loading = signal(true);
  revenue = signal<RevenueReport | null>(null);
  traffic = signal<HourlyTraffic[]>([]);
  utilisation = signal<UtilisationStats | null>(null);
  lots = signal<ParkingLot[]>([]);
  activeLotId = signal<number>(0);
  driverData = signal<DriverAnalytics | null>(null);
  recentBookings = signal<Booking[]>([]);
  range = signal<Range>('30d');

  isDriver = () => this.auth.currentUser()?.role === 'DRIVER';

  ranges = [
    { label: 'Today', value: '1d' as Range },
    { label: '15 Days', value: '15d' as Range },
    { label: '30 Days', value: '30d' as Range },
  ];

  selectedLotName = () =>
    this.lots().find((l) => l.lotId === this.activeLotId())?.name ?? `Lot ${this.activeLotId()}`;
  rangeLabel = () => this.ranges.find((r) => r.value === this.range())?.label ?? '';

  private hourlyChart?: Chart;
  private splitChart?: Chart;
  private driverSplitChart?: Chart;

  ngOnInit() {
    if (this.isDriver()) {
      this.loadDriverData();
      return;
    }

    const role = this.auth.currentUser()?.role;
    const lots$ = role === 'ADMIN' ? this.parking.getLots() : this.parking.getManagerLots();

    lots$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (lots) => {
        this.lots.set(lots);

        // Sync with dashboard selection if available
        const savedId = this.parking.selectedLotId();
        const initialLot = lots.find((l) => l.lotId === savedId) || lots[0];

        if (initialLot) {
          this.activeLotId.set(initialLot.lotId);
          this.parking.selectedLotId.set(initialLot.lotId);
        }
        this.loadLotData();
      },
      error: () => this.loadLotData(),
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.hourlyChart?.destroy();
    this.splitChart?.destroy();
    this.driverSplitChart?.destroy();
  }

  setRange(r: Range) {
    this.range.set(r);
    this.isDriver() ? this.loadDriverData() : this.loadLotData();
  }
  setLot(lotId: number) {
    this.activeLotId.set(lotId);
    this.parking.selectedLotId.set(lotId);
    this.loadLotData();
  }

  private dateRange() {
    const range = this.range();
    const now = new Date();
    const from = new Date();

    if (range === '1d') {
      from.setHours(0, 0, 0, 0);
    } else if (range === '15d') {
      from.setDate(now.getDate() - 15);
    } else {
      from.setDate(now.getDate() - 30);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const fmt = (d: Date) => {
      const Y = d.getFullYear();
      const M = pad(d.getMonth() + 1);
      const D = pad(d.getDate());
      const h = pad(d.getHours());
      const m = pad(d.getMinutes());
      const s = pad(d.getSeconds());
      return `${Y}-${M}-${D}T${h}:${m}:${s}`;
    };

    return { from: fmt(from), to: fmt(now) };
  }

  private loadDriverData() {
    this.loading.set(true);
    this.driverSplitChart?.destroy();
    const { from, to } = this.dateRange();
    this.analytics
      .getDriverAnalytics(from, to)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Driver analytics error:', err);
          return of(null);
        }),
      )
      .subscribe({
        next: (data) => {
          this.driverData.set(data);
          this.loading.set(false);
          if (data) setTimeout(() => this.renderDriverChart(), 300);
        },
      });
  }

  private loadLotData() {
    this.loading.set(true);
    this.hourlyChart?.destroy();
    this.splitChart?.destroy();
    const { from, to } = this.dateRange();
    const id = this.activeLotId();
    if (!id) {
      this.loading.set(false);
      return;
    }

    // Fetch analytics AND recent bookings to verify data presence
    forkJoin({
      traffic: this.analytics.getHourlyTraffic(id, from, to).pipe(catchError(() => of([]))),
      utilisation: this.analytics.getUtilisation(id, from, to).pipe(catchError(() => of(null))),
      revenue: this.analytics.getRevenue(id, from, to).pipe(catchError(() => of(null))),
      bookings: this.booking.getBookingsByLot(id).pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ traffic, utilisation, revenue, bookings }) => {
          this.traffic.set(traffic || []);
          this.utilisation.set(utilisation);
          this.revenue.set(revenue);
          this.recentBookings.set(bookings || []);
          this.loading.set(false);
          setTimeout(() => this.renderLotCharts(), 300);
        },
        error: (err) => {
          console.error('Lot analytics forkJoin error:', err);
          this.loading.set(false);
        },
      });
  }

  private renderLotCharts() {
    const textClr = '#71767b';
    const gridClr = 'rgba(255,255,255,.05)';
    const traffic = this.traffic();
    const util = this.utilisation();

    // Hourly line chart
    if (this.hourlyRef?.nativeElement && traffic.length) {
      this.hourlyChart?.destroy();
      const ctx = this.hourlyRef.nativeElement.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 260);
      grad.addColorStop(0, 'rgba(99,102,241,.25)');
      grad.addColorStop(1, 'rgba(99,102,241,0)');

      this.hourlyChart = new Chart(this.hourlyRef.nativeElement, {
        type: 'line',
        data: {
          labels: traffic.map((t) => `${String(t.hour).padStart(2, '0')}:00`),
          datasets: [
            {
              label: 'Bookings',
              data: traffic.map((t) => t.bookingCount),
              borderColor: '#6366f1',
              backgroundColor: grad,
              borderWidth: 2.5,
              pointBackgroundColor: '#6366f1',
              pointBorderColor: '#0a0a0a',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: true,
              tension: 0.45,
            },
          ],
        },
        options: {
          animation: { duration: 800, easing: 'easeOutQuart' },
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111',
              titleColor: '#e7e9ea',
              bodyColor: '#71767b',
              borderColor: 'rgba(255,255,255,.08)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y} bookings`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridClr },
              border: { display: false },
              ticks: { color: textClr, font: { size: 11, weight: 'bold' } },
            },
            y: {
              grid: { color: gridClr },
              border: { display: false },
              ticks: {
                color: textClr,
                font: { size: 11, weight: 'bold' },
                stepSize: 1,
                precision: 0,
              },
              beginAtZero: true,
            },
          },
        },
      } as ChartConfiguration);
    }

    // Booking split doughnut
    if (this.splitRef?.nativeElement && util && util.total > 0) {
      this.splitChart?.destroy();
      this.splitChart = new Chart(this.splitRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Pre-Booking', 'Walk-In'],
          datasets: [
            {
              data: [util.preBookingCount, util.walkInCount],
              backgroundColor: ['rgba(99,102,241,.9)', 'rgba(255,212,0,.9)'],
              borderColor: ['#6366f1', '#ffd400'],
              borderWidth: 1.5,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          animation: { animateRotate: true, duration: 800 },
          responsive: true,
          cutout: '75%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111',
              titleColor: '#e7e9ea',
              bodyColor: '#71767b',
              borderColor: 'rgba(255,255,255,.08)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
            },
          },
        },
      } as ChartConfiguration);
    }
  }

  private renderDriverChart() {
    const data = this.driverData();
    const textClr = '#71767b';

    if (this.driverSplitRef?.nativeElement && data && data.totalBookings > 0) {
      this.driverSplitChart?.destroy();
      this.driverSplitChart = new Chart(this.driverSplitRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Pre-Booking', 'Walk-In'],
          datasets: [
            {
              data: [data.preBookingCount || 0, data.walkInCount || 0],
              backgroundColor: ['rgba(99,102,241,.9)', 'rgba(255,212,0,.9)'],
              borderColor: ['#6366f1', '#ffd400'],
              borderWidth: 1.5,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          animation: { animateRotate: true, duration: 800 },
          responsive: true,
          cutout: '75%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111',
              titleColor: '#e7e9ea',
              bodyColor: textClr,
              borderColor: 'rgba(255,255,255,.08)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
            },
          },
        },
      } as ChartConfiguration);
    }
  }

  statusColor(s: string) {
    return s === 'CONFIRMED' || s === 'CHECKED_IN'
      ? '#00ba7c'
      : s === 'CANCELLED' || s === 'EXPIRED'
        ? '#f4212e'
        : '#71767b';
  }
  statusBg(s: string) {
    return s === 'CONFIRMED' || s === 'CHECKED_IN'
      ? 'rgba(0,186,124,.1)'
      : s === 'CANCELLED' || s === 'EXPIRED'
        ? 'rgba(244,33,46,.1)'
        : 'rgba(255,255,255,.05)';
  }
}

