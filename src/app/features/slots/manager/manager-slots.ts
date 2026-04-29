import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingSpot, ParkingLot, SpotType } from '../../../core/models/parking.models';

@Component({
  selector: 'app-manager-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))])]),
    trigger('slotAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(.9)' }),
          stagger(20, [animate('240ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'scale(1)' }))])
        ], { optional: true })
      ])
    ]),
  ],
  template: `
    <div class="p-6 space-y-5 page-host" @fadeUp>

      <!-- Tabs -->
      <div class="flex items-center gap-2 flex-wrap">
        <h2 style="font-size:22px;font-weight:700;color:var(--text-primary);margin:0;flex:1;">Parking Management</h2>
        <div class="flex rounded-xl p-1" style="background:var(--bg-hover);border:1px solid var(--border);">
          <button (click)="mgrTab.set('lots')"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  [style.background]="mgrTab() === 'lots' ? 'var(--bg-card)' : 'transparent'"
                  [style.color]="mgrTab() === 'lots' ? 'var(--text-primary)' : 'var(--text-secondary)'"
                  style="border:none;cursor:pointer;">My Lots</button>
          <button (click)="mgrTab.set('spots')"
                  class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  [style.background]="mgrTab() === 'spots' ? 'var(--bg-card)' : 'transparent'"
                  [style.color]="mgrTab() === 'spots' ? 'var(--text-primary)' : 'var(--text-secondary)'"
                  style="border:none;cursor:pointer;">Spots</button>
        </div>
        @if (mgrTab() === 'lots') {
          <button (click)="showLotForm.set(!showLotForm())" class="btn-accent flex items-center gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Create Lot
          </button>
        }
        @if (mgrTab() === 'spots' && selectedLot()) {
          <button (click)="showSpotForm.set(!showSpotForm())" class="btn-accent flex items-center gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add Spot
          </button>
          <button (click)="showBulkForm.set(!showBulkForm())"
                  class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>
            Bulk Add
          </button>
        }
      </div>

      <!-- ── MY LOTS TAB ── -->
      @if (mgrTab() === 'lots') {

        <!-- Create lot form -->
        @if (showLotForm()) {
          <div class="card p-6" @fadeIn>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 16px;">New Parking Lot</h3>
            <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">
              <div class="floating-group" style="grid-column:1/-1;">
                <input [(ngModel)]="lotForm.name" type="text" id="lname" placeholder=" "/>
                <label for="lname">Lot Name *</label>
              </div>
              <div class="floating-group" style="grid-column:1/-1;">
                <input [(ngModel)]="lotForm.address" type="text" id="laddr" placeholder=" "/>
                <label for="laddr">Address *</label>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="lotForm.city" type="text" id="lcity" placeholder=" "/>
                <label for="lcity">City *</label>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="lotForm.latitude" type="number" id="llat" placeholder=" "/>
                <label for="llat">Latitude</label>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="lotForm.longitude" type="number" id="llng" placeholder=" "/>
                <label for="llng">Longitude</label>
              </div>
              <div class="col-span-2">
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Max Capacity (spots) *</p>
                <input [(ngModel)]="lotForm.maxCapacity" type="number" min="1" max="10000" placeholder="e.g. 100"
                       class="w-full px-3 py-3 rounded-xl text-sm"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
              </div>
              <div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Opening Time *</p>
                <input [(ngModel)]="lotForm.openingTime" type="time"
                       class="w-full px-3 py-3 rounded-xl text-sm"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
              </div>
              <div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Closing Time *</p>
                <input [(ngModel)]="lotForm.closingTime" type="time"
                       class="w-full px-3 py-3 rounded-xl text-sm"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;"/>
              </div>
            </div>
            @if (lotFormError()) {
              <p class="mt-3" style="font-size:13px;color:#f4212e;">{{ lotFormError() }}</p>
            }
            <div class="flex gap-3 mt-5">
              <button (click)="createLot()" [disabled]="lotSaving()"
                      class="btn-accent" [style.opacity]="lotSaving() ? '.6' : '1'">
                {{ lotSaving() ? 'Submitting…' : 'Submit for Approval' }}
              </button>
              <button (click)="showLotForm.set(false)"
                      style="padding:10px 20px;border-radius:9999px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:14px;">
                Cancel
              </button>
            </div>
          </div>
        }

        <!-- Lots list -->
        @if (loadingLots()) {
          <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">
            @for (i of [1,2]; track i) {
              <div class="card p-5 animate-pulse" style="height:120px;background:var(--bg-card);"></div>
            }
          </div>
        } @else if (myLots().length === 0) {
          <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
            <p style="font-size:15px;color:var(--text-secondary);">No lots yet. Create your first parking lot above.</p>
          </div>
        } @else {
          <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));" @fadeUp>
            @for (lot of myLots(); track lot.lotId) {
              <div class="card p-5">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <p style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0;">{{ lot.name }}</p>
                    <p style="font-size:12px;color:var(--text-secondary);margin:2px 0 0;">{{ lot.address }}, {{ lot.city }}</p>
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                        [style.background]="lotStatusBg(lot.status)"
                        [style.color]="lotStatusColor(lot.status)">
                    {{ lot.status }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-3 gap-2 flex-wrap">
                  <span style="font-size:12px;color:var(--text-secondary);">{{ lot.openingTime }} – {{ lot.closingTime }}</span>
                  <div class="flex items-center gap-2">
                    <!-- Manage Spots shortcut -->
                    <button (click)="goToSpots(lot.lotId)"
                            class="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
                            style="background:var(--accent-dim);border:1px solid rgba(29,155,240,.25);color:var(--accent);cursor:pointer;">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"/>
                      </svg>
                      Manage Spots
                    </button>
                    @if (lot.status === 'APPROVED' || lot.status === 'CLOSED') {
                      <button (click)="toggleLot(lot.lotId)"
                              class="text-xs px-3 py-1.5 rounded-full font-semibold"
                              [style.background]="lot.status === 'APPROVED' ? 'rgba(0,186,124,.1)' : 'rgba(244,33,46,.08)'"
                              [style.border]="'1px solid ' + (lot.status === 'APPROVED' ? 'rgba(0,186,124,.25)' : 'rgba(244,33,46,.2)')"
                              [style.color]="lot.status === 'APPROVED' ? '#00ba7c' : '#f4212e'"
                              style="cursor:pointer;">
                        {{ lot.status === 'APPROVED' ? 'Close Lot' : 'Reopen Lot' }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── SPOTS TAB ── -->
      @if (mgrTab() === 'spots') {

        <!-- Lot selector -->
        <div class="flex flex-wrap gap-3 items-center">
          <select [ngModel]="selectedLotId()" (ngModelChange)="selectedLotId.set($event); onMgrLotChange()"
                  class="px-3 py-2 rounded-xl text-sm"
                  style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);outline:none;">
            <option value="">— Select a lot —</option>
            @for (lot of myLots(); track lot.lotId) {
              <option [value]="lot.lotId">{{ lot.name }}</option>
            }
          </select>
          <span style="font-size:13px;color:var(--text-secondary);">{{ allSpots().length }} spots total</span>
        </div>

        <!-- Add spot form -->
        @if (showSpotForm() && selectedLot()) {
          <div class="card p-6" @fadeIn>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 16px;">Add Spot to {{ selectedLot()!.name }}</h3>
            <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
              <div class="floating-group">
                <input [(ngModel)]="spotForm.spotNumber" type="text" id="snum" placeholder=" "/>
                <label for="snum">Spot Number *</label>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="spotForm.floor" type="number" id="sfloor" placeholder=" " min="0"/>
                <label for="sfloor">Floor *</label>
              </div>
              <div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Type *</p>
                <select [(ngModel)]="spotForm.spotType"
                        class="w-full px-3 py-3 rounded-xl text-sm"
                        style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;">
                  @for (t of spotTypes; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="spotForm.pricePerHour" type="number" id="sprice" placeholder=" " min="1"/>
                <label for="sprice">Price/hr (₹) *</label>
              </div>
              <div class="flex items-center gap-3 pt-2">
                <button (click)="spotForm.ev = !spotForm.ev"
                        class="w-10 h-6 rounded-full flex items-center transition-all"
                        [style.background]="spotForm.ev ? '#00ba7c' : 'var(--border)'"
                        style="border:none;cursor:pointer;padding:2px;">
                  <span class="w-5 h-5 rounded-full bg-white block transition-all"
                        [style.transform]="spotForm.ev ? 'translateX(16px)' : 'translateX(0)'"></span>
                </button>
                <span style="font-size:13px;color:var(--text-primary);">EV Charging</span>
              </div>
              <div class="flex items-center gap-3 pt-2">
                <button (click)="spotForm.handicapped = !spotForm.handicapped"
                        class="w-10 h-6 rounded-full flex items-center transition-all"
                        [style.background]="spotForm.handicapped ? 'var(--accent)' : 'var(--border)'"
                        style="border:none;cursor:pointer;padding:2px;">
                  <span class="w-5 h-5 rounded-full bg-white block transition-all"
                        [style.transform]="spotForm.handicapped ? 'translateX(16px)' : 'translateX(0)'"></span>
                </button>
                <span style="font-size:13px;color:var(--text-primary);">Accessible</span>
              </div>
            </div>
            @if (spotFormError()) {
              <p class="mt-3" style="font-size:13px;color:#f4212e;">{{ spotFormError() }}</p>
            }
            <div class="flex gap-3 mt-5">
              <button (click)="addSpot()" [disabled]="spotSaving()"
                      class="btn-accent" [style.opacity]="spotSaving() ? '.6' : '1'">
                {{ spotSaving() ? 'Adding…' : 'Add Spot' }}
              </button>
              <button (click)="showSpotForm.set(false)"
                      style="padding:10px 20px;border-radius:9999px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:14px;">
                Cancel
              </button>
            </div>
          </div>
        }

        <!-- Bulk add form -->
        @if (showBulkForm() && selectedLot()) {
          <div class="card p-6" @fadeIn>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 16px;">
              Bulk Add Spots to {{ selectedLot()!.name }}
            </h3>
            <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
              <div class="floating-group">
                <input [(ngModel)]="bulkForm.count" type="number" id="bcount" placeholder=" " min="1" max="100"/>
                <label for="bcount">Count *</label>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="bulkForm.floor" type="number" id="bfloor" placeholder=" " min="0"/>
                <label for="bfloor">Floor *</label>
              </div>
              <div class="floating-group">
                <input [(ngModel)]="bulkForm.pricePerHour" type="number" id="bprice" placeholder=" " min="1"/>
                <label for="bprice">Price/hr (₹) *</label>
              </div>
              <div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Spot Type</p>
                <select [(ngModel)]="bulkForm.spotType"
                        class="w-full px-3 py-3 rounded-xl text-sm"
                        style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;">
                  @for (t of spotTypes; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
              <div>
                <p style="font-size:12px;color:var(--text-secondary);margin:0 0 4px;">Prefix (optional)</p>
                <input [(ngModel)]="bulkForm.prefix" type="text" maxlength="4" placeholder="e.g. A"
                       class="w-full px-3 py-3 rounded-xl text-sm"
                       style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);outline:none;text-transform:uppercase;"/>
              </div>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">
              Will create {{ bulkForm.count }} spots: {{ bulkForm.prefix || 'S' }}1 → {{ bulkForm.prefix || 'S' }}{{ bulkForm.count }}
            </p>
            @if (bulkFormError()) {
              <p class="mt-2" style="font-size:13px;color:#f4212e;">{{ bulkFormError() }}</p>
            }
            <div class="flex gap-3 mt-4">
              <button (click)="bulkAddSpots()" [disabled]="bulkSaving()"
                      class="btn-accent" [style.opacity]="bulkSaving() ? '.6' : '1'">
                {{ bulkSaving() ? 'Adding…' : 'Create ' + bulkForm.count + ' Spots' }}
              </button>
              <button (click)="showBulkForm.set(false)"
                      style="padding:10px 20px;border-radius:9999px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:14px;">
                Cancel
              </button>
            </div>
          </div>
        }

        <!-- Spot grid -->
        @if (!selectedLotId()) {
          <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
            <p style="font-size:15px;color:var(--text-secondary);">Select a lot to manage its spots.</p>
          </div>
        } @else if (loadingSpots()) {
          <div class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr));">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="rounded-2xl animate-pulse" style="height:100px;background:var(--bg-card);"></div>
            }
          </div>
        } @else if (allSpots().length === 0) {
          <div class="card p-12 flex flex-col items-center text-center" @fadeUp>
            <p style="font-size:15px;color:var(--text-secondary);">No spots yet. Add some spots above.</p>
          </div>
        } @else {
          <div class="grid gap-2" [@slotAnim]="allSpots().length"
               style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr));">
            @for (spot of allSpots(); track spot.spotId) {
              <div class="flex flex-col items-center justify-between rounded-2xl border-2 p-2"
                   style="min-height:100px;"
                   [class.slot-available]="spot.status === 'AVAILABLE'"
                   [class.slot-reserved]="spot.status === 'RESERVED'"
                   [class.slot-occupied]="spot.status === 'OCCUPIED'">
                <div class="flex flex-col items-center flex-1 justify-center">
                  <span style="font-size:13px;font-weight:700;">{{ spot.spotNumber }}</span>
                  <span style="font-size:10px;opacity:.75;">F{{ spot.floor }}</span>
                  <span style="font-size:9px;opacity:.6;">{{ spot.spotType | slice:0:3 }}</span>
                  <span style="font-size:9px;font-weight:600;">₹{{ spot.pricePerHour }}/h</span>
                </div>
                <button (click)="deleteSpot(spot.spotId)"
                        style="background:rgba(244,33,46,.12);border:none;cursor:pointer;border-radius:6px;padding:2px 6px;color:#f4212e;font-size:10px;font-weight:600;margin-top:4px;">
                  Remove
                </button>
              </div>
            }
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .animate-pulse { animation: pulse 1.5s cubic-bezier(.4,0,.6,1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
  `]
})
export class ManagerSlotsComponent implements OnInit, OnDestroy {
  private parking  = inject(ParkingService);
  private auth     = inject(AuthService);
  private destroy$ = new Subject<void>();

  allSpots     = signal<ParkingSpot[]>([]);
  loadingSpots = signal(true);
  loadingLots  = signal(true);

  spotTypes: SpotType[] = ['STANDARD','COMPACT','LARGE','EV_ONLY','HANDICAPPED'];
  legend = [
    { label: 'Available', color: '#00ba7c' },
    { label: 'Reserved',  color: '#ffd400' },
    { label: 'Occupied',  color: '#f4212e' },
  ];

  // Manager
  mgrTab       = signal<'lots' | 'spots'>('lots');
  myLots       = signal<ParkingLot[]>([]);
  selectedLotId = signal<string>('');
  showLotForm  = signal(false);
  showSpotForm = signal(false);
  lotSaving    = signal(false);
  spotSaving   = signal(false);
  lotFormError = signal('');
  spotFormError = signal('');

  selectedLot = computed(() => this.myLots().find(l => l.lotId === +this.selectedLotId()) ?? null);

  lotForm = { name: '', address: '', city: '', latitude: 0, longitude: 0, openingTime: '08:00', closingTime: '22:00', maxCapacity: undefined as number | undefined };
  spotForm = { spotNumber: '', floor: 0, spotType: 'STANDARD' as SpotType, pricePerHour: 50, ev: false, handicapped: false };

  // Manager bulk add
  showBulkForm  = signal(false);
  bulkSaving    = signal(false);
  bulkFormError = signal('');
  bulkForm = { count: 10, floor: 1, spotType: 'STANDARD' as SpotType, pricePerHour: 50, prefix: '' };

  // Filter state (used by spot grid in spots tab)
  floors       = signal<number[]>([]);
  floorFilter  = '';
  typeFilter   = '';

  ngOnInit() {
    this.parking.getManagerLots().pipe(takeUntil(this.destroy$)).subscribe({
      next: lots => { this.myLots.set(lots); this.loadingLots.set(false); this.loadingSpots.set(false); },
      error: () => { this.loadingLots.set(false); this.loadingSpots.set(false); }
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onMgrLotChange() {
    if (!this.selectedLotId()) { this.allSpots.set([]); return; }
    this.loadingSpots.set(true);
    this.parking.getSpots(+this.selectedLotId()).pipe(takeUntil(this.destroy$)).subscribe({
      next: spots => { this.allSpots.set(spots); this.loadingSpots.set(false); },
      error: () => this.loadingSpots.set(false)
    });
  }

  goToSpots(lotId: number) {
    this.selectedLotId.set(String(lotId));
    this.mgrTab.set('spots');
    this.onMgrLotChange();
  }

  createLot() {
    const f = this.lotForm;
    if (!f.name || !f.address || !f.city || !f.openingTime || !f.closingTime) {
      this.lotFormError.set('Please fill all required fields.'); return;
    }
    if (!f.maxCapacity || f.maxCapacity < 1) {
      this.lotFormError.set('Max capacity must be at least 1.'); return;
    }
    this.lotSaving.set(true);
    this.lotFormError.set('');
    this.parking.createLot(f).pipe(takeUntil(this.destroy$)).subscribe({
      next: lot => {
        this.myLots.update(l => [lot, ...l]);
        this.lotForm = { name: '', address: '', city: '', latitude: 0, longitude: 0, openingTime: '08:00', closingTime: '22:00', maxCapacity: undefined };
        this.showLotForm.set(false);
        this.lotSaving.set(false);
      },
      error: err => {
        this.lotFormError.set(err?.error?.message ?? 'Failed to create lot.');
        this.lotSaving.set(false);
      }
    });
  }

  toggleLot(id: number) {
    this.parking.toggleLot(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => this.myLots.update(l => l.map(lot => lot.lotId === id ? updated : lot))
    });
  }

  addSpot() {
    const f = this.spotForm;
    if (!f.spotNumber || f.pricePerHour <= 0) { this.spotFormError.set('Spot number and price are required.'); return; }
    this.spotSaving.set(true);
    this.spotFormError.set('');
    this.parking.createSpot(+this.selectedLotId(), f).pipe(takeUntil(this.destroy$)).subscribe({
      next: spot => {
        this.allSpots.update(s => [...s, spot]);
        this.spotForm = { spotNumber: '', floor: 0, spotType: 'STANDARD', pricePerHour: 50, ev: false, handicapped: false };
        this.showSpotForm.set(false);
        this.spotSaving.set(false);
      },
      error: err => {
        this.spotFormError.set(err?.error?.message ?? 'Failed to add spot.');
        this.spotSaving.set(false);
      }
    });
  }

  deleteSpot(spotId: number) {
    this.parking.deleteSpot(spotId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.allSpots.update(s => s.filter(x => x.spotId !== spotId))
    });
  }

  bulkAddSpots() {
    if (!this.selectedLotId() || this.bulkForm.count < 1) { this.bulkFormError.set('Count must be at least 1.'); return; }
    this.bulkSaving.set(true);
    this.bulkFormError.set('');
    const prefix = (this.bulkForm.prefix || 'S').toUpperCase();
    const spots = Array.from({ length: this.bulkForm.count }, (_, i) => ({
      spotNumber:   `${prefix}${i + 1}`,
      floor:        this.bulkForm.floor,
      spotType:     this.bulkForm.spotType,
      pricePerHour: this.bulkForm.pricePerHour,
      status:       'AVAILABLE' as const
    }));
    this.parking.bulkCreateSpots(+this.selectedLotId(), spots).pipe(takeUntil(this.destroy$)).subscribe({
      next: created => {
        this.allSpots.update(s => [...s, ...created]);
        this.bulkSaving.set(false);
        this.showBulkForm.set(false);
        this.bulkForm = { count: 10, floor: 1, spotType: 'STANDARD', pricePerHour: 50, prefix: '' };
      },
      error: err => { this.bulkFormError.set(err?.error?.message ?? 'Bulk add failed.'); this.bulkSaving.set(false); }
    });
  }

  lotStatusColor(s: string) { return s === 'APPROVED' || s === 'ACTIVE' ? '#00ba7c' : s === 'PENDING' ? '#ffd400' : '#f4212e'; }
  lotStatusBg(s: string) { return s === 'APPROVED' || s === 'ACTIVE' ? 'rgba(0,186,124,.12)' : s === 'PENDING' ? 'rgba(255,212,0,.12)' : 'rgba(244,33,46,.12)'; }

  applyFilter() {
    // Filter state placeholder — manager uses allSpots() directly in spots tab
  }
}
