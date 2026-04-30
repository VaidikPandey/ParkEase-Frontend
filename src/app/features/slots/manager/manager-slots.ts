import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ParkingService } from '../../../core/services/parking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingSpot, ParkingLot, SpotType } from '../../../core/models/parking.models';

const spotStatusColor: Record<string, string> = { AVAILABLE: '#00ba7c', RESERVED: '#ffd400', OCCUPIED: '#f4212e' };
const spotStatusBg:    Record<string, string> = { AVAILABLE: 'rgba(0,186,124,.12)', RESERVED: 'rgba(255,212,0,.1)', OCCUPIED: 'rgba(244,33,46,.1)' };

@Component({
  selector: 'app-manager-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- Header + tabs -->
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <h1 style="font-size:22px;font-weight:800;color:#e7e9ea;margin:0;letter-spacing:-.3px;">Parking Management</h1>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <!-- Tab toggle -->
          <div style="display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:4px;gap:4px;">
            <button (click)="mgrTab.set('lots')"
                    style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 150ms;"
                    [style.background]="mgrTab() === 'lots' ? 'rgba(255,255,255,.08)' : 'transparent'"
                    [style.color]="mgrTab() === 'lots' ? '#e7e9ea' : '#71767b'">My Lots</button>
            <button (click)="mgrTab.set('spots')"
                    style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 150ms;"
                    [style.background]="mgrTab() === 'spots' ? 'rgba(255,255,255,.08)' : 'transparent'"
                    [style.color]="mgrTab() === 'spots' ? '#e7e9ea' : '#71767b'">Spots</button>
          </div>
          @if (mgrTab() === 'lots') {
            <button (click)="showLotForm.set(!showLotForm())"
                    style="padding:8px 16px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity 150ms;"
                    onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              Create Lot
            </button>
          }
          @if (mgrTab() === 'spots' && selectedLot()) {
            <button (click)="showSpotForm.set(!showSpotForm())"
                    style="padding:8px 16px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity 150ms;"
                    onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              Add Spot
            </button>
            <button (click)="showBulkForm.set(!showBulkForm())"
                    style="padding:8px 16px;border-radius:9999px;background:rgba(255,255,255,.05);color:#71767b;border:1px solid rgba(255,255,255,.08);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity 150ms;"
                    onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
              Bulk Add
            </button>
          }
        </div>
      </div>

      <!-- ── MY LOTS TAB ── -->
      @if (mgrTab() === 'lots') {

        <!-- Create lot form -->
        @if (showLotForm()) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:20px;" class="anim-in anim-d1">
            <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">New Parking Lot</p>
            </div>
            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;">
                <div style="grid-column:1/-1;">
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Lot Name <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="lotForm.name" type="text" placeholder="e.g. Central Park Lot A"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div style="grid-column:1/-1;">
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Address <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="lotForm.address" type="text" placeholder="Street address"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">City <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="lotForm.city" type="text" placeholder="City"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Max Capacity <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="lotForm.maxCapacity" type="number" min="1" max="10000" placeholder="e.g. 100"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Opening Time <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="lotForm.openingTime" type="time"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Closing Time <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="lotForm.closingTime" type="time"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Latitude</label>
                  <input [(ngModel)]="lotForm.latitude" type="number" placeholder="0.0"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Longitude</label>
                  <input [(ngModel)]="lotForm.longitude" type="number" placeholder="0.0"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
              </div>
              @if (lotFormError()) {
                <p style="font-size:13px;color:#f4212e;margin:0;">{{ lotFormError() }}</p>
              }
              <div style="display:flex;gap:10px;">
                <button (click)="createLot()" [disabled]="lotSaving()"
                        style="padding:10px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="lotSaving() ? '.5' : '1'">
                  {{ lotSaving() ? 'Submitting…' : 'Submit for Approval' }}
                </button>
                <button (click)="showLotForm.set(false)"
                        style="padding:10px 20px;border-radius:9999px;background:rgba(255,255,255,.05);color:#71767b;border:1px solid rgba(255,255,255,.08);font-size:14px;cursor:pointer;">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Lots list -->
        @if (loadingLots()) {
          <div style="display:flex;flex-direction:column;gap:8px;">
            @for (i of [1,2]; track i) {
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;height:100px;animation:pulse 1.5s ease-in-out infinite;"></div>
            }
          </div>
        } @else if (myLots().length === 0) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:56px 24px;text-align:center;">
            <p style="font-size:14px;color:#71767b;margin:0;">No lots yet. Create your first parking lot above.</p>
          </div>
        } @else {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;" class="anim-in anim-d1">
            @for (lot of myLots(); track lot.lotId; let last = $last) {
              <div style="display:flex;align-items:center;gap:14px;padding:16px 20px;transition:background 120ms ease;"
                   [style.border-bottom]="last ? 'none' : '1px solid rgba(255,255,255,.04)'"
                   onmouseenter="this.style.background='rgba(255,255,255,.03)'"
                   onmouseleave="this.style.background='transparent'">
                <div style="width:40px;height:40px;border-radius:10px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/>
                  </svg>
                </div>
                <div style="flex:1;min-width:0;">
                  <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ lot.name }}</p>
                  <p style="font-size:12px;color:#71767b;margin:0;">{{ lot.address }}, {{ lot.city }} · {{ lot.openingTime }} – {{ lot.closingTime }}</p>
                </div>
                <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.06em;text-transform:uppercase;flex-shrink:0;"
                      [style.background]="lotStatusBg(lot.status)" [style.color]="lotStatusColor(lot.status)">{{ lot.status }}</span>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                  <button (click)="goToSpots(lot.lotId)"
                          style="font-size:12px;padding:6px 12px;border-radius:9999px;font-weight:600;background:rgba(29,155,240,.1);color:#1d9bf0;border:none;cursor:pointer;transition:opacity 150ms;"
                          onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                    Manage Spots
                  </button>
                  @if (lot.status === 'APPROVED' || lot.status === 'CLOSED') {
                    <button (click)="toggleLot(lot.lotId)"
                            style="font-size:12px;padding:6px 12px;border-radius:9999px;font-weight:600;border:none;cursor:pointer;transition:opacity 150ms;"
                            [style.background]="lot.status === 'APPROVED' ? 'rgba(0,186,124,.1)' : 'rgba(244,33,46,.08)'"
                            [style.color]="lot.status === 'APPROVED' ? '#00ba7c' : '#f4212e'"
                            onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'">
                      {{ lot.status === 'APPROVED' ? 'Close Lot' : 'Reopen Lot' }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── SPOTS TAB ── -->
      @if (mgrTab() === 'spots') {
        <!-- Lot selector + legend -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
          <select [ngModel]="selectedLotId()" (ngModelChange)="selectedLotId.set($event); onMgrLotChange()"
                  style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 14px;font-size:13px;color:#e7e9ea;outline:none;cursor:pointer;">
            <option value="" style="background:#1c1c1c;">— Select a lot —</option>
            @for (lot of myLots(); track lot.lotId) {
              <option [value]="lot.lotId" style="background:#1c1c1c;">{{ lot.name }}</option>
            }
          </select>
          <span style="font-size:12px;color:#71767b;">{{ allSpots().length }} spots total</span>
          <div style="margin-left:auto;display:flex;gap:14px;">
            @for (leg of legend; track leg.label) {
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:8px;height:8px;border-radius:50%;" [style.background]="leg.color"></div>
                <span style="font-size:12px;color:#71767b;">{{ leg.label }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Add spot form -->
        @if (showSpotForm() && selectedLot()) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:20px;" class="anim-in">
            <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Add Spot to {{ selectedLot()!.name }}</p>
            </div>
            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Spot Number <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="spotForm.spotNumber" type="text" placeholder="e.g. A1"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Floor <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="spotForm.floor" type="number" min="0" placeholder="0"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Type <span style="color:#f4212e;">*</span></label>
                  <select [(ngModel)]="spotForm.spotType"
                          style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;cursor:pointer;">
                    @for (t of spotTypes; track t) { <option [value]="t" style="background:#1c1c1c;">{{ t }}</option> }
                  </select>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Price/hr (₹) <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="spotForm.pricePerHour" type="number" min="1" placeholder="50"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div style="display:flex;align-items:center;gap:10px;padding-top:4px;">
                  <button (click)="spotForm.ev = !spotForm.ev"
                          style="width:38px;height:20px;border-radius:9999px;border:none;cursor:pointer;padding:2px;transition:background 200ms;flex-shrink:0;display:flex;align-items:center;"
                          [style.background]="spotForm.ev ? '#00ba7c' : 'rgba(255,255,255,.15)'">
                    <span style="width:16px;height:16px;border-radius:50%;background:#fff;display:block;transition:transform 200ms;"
                          [style.transform]="spotForm.ev ? 'translateX(18px)' : 'translateX(0)'"></span>
                  </button>
                  <span style="font-size:13px;color:#e7e9ea;">EV Charging</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;padding-top:4px;">
                  <button (click)="spotForm.handicapped = !spotForm.handicapped"
                          style="width:38px;height:20px;border-radius:9999px;border:none;cursor:pointer;padding:2px;transition:background 200ms;flex-shrink:0;display:flex;align-items:center;"
                          [style.background]="spotForm.handicapped ? '#1d9bf0' : 'rgba(255,255,255,.15)'">
                    <span style="width:16px;height:16px;border-radius:50%;background:#fff;display:block;transition:transform 200ms;"
                          [style.transform]="spotForm.handicapped ? 'translateX(18px)' : 'translateX(0)'"></span>
                  </button>
                  <span style="font-size:13px;color:#e7e9ea;">Accessible</span>
                </div>
              </div>
              @if (spotFormError()) {
                <p style="font-size:13px;color:#f4212e;margin:0;">{{ spotFormError() }}</p>
              }
              <div style="display:flex;gap:10px;">
                <button (click)="addSpot()" [disabled]="spotSaving()"
                        style="padding:10px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="spotSaving() ? '.5' : '1'">
                  {{ spotSaving() ? 'Adding…' : 'Add Spot' }}
                </button>
                <button (click)="showSpotForm.set(false)"
                        style="padding:10px 20px;border-radius:9999px;background:rgba(255,255,255,.05);color:#71767b;border:1px solid rgba(255,255,255,.08);font-size:14px;cursor:pointer;">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Bulk add form -->
        @if (showBulkForm() && selectedLot()) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:20px;" class="anim-in">
            <div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.06);">
              <p style="font-size:14px;font-weight:700;color:#e7e9ea;margin:0;">Bulk Add Spots to {{ selectedLot()!.name }}</p>
            </div>
            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;">
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Count <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="bulkForm.count" type="number" min="1" max="100" placeholder="10"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Floor <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="bulkForm.floor" type="number" min="0" placeholder="1"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Price/hr (₹) <span style="color:#f4212e;">*</span></label>
                  <input [(ngModel)]="bulkForm.pricePerHour" type="number" min="1" placeholder="50"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Spot Type</label>
                  <select [(ngModel)]="bulkForm.spotType"
                          style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;cursor:pointer;">
                    @for (t of spotTypes; track t) { <option [value]="t" style="background:#1c1c1c;">{{ t }}</option> }
                  </select>
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#71767b;font-weight:600;margin-bottom:6px;letter-spacing:.03em;">Prefix <span style="color:#536471;font-weight:400;">(optional)</span></label>
                  <input [(ngModel)]="bulkForm.prefix" type="text" maxlength="4" placeholder="e.g. A"
                         style="width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 14px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;text-transform:uppercase;transition:border-color 150ms;"
                         onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.08)'"/>
                </div>
              </div>
              <p style="font-size:12px;color:#71767b;margin:0;">
                Will create {{ bulkForm.count }} spots: {{ bulkForm.prefix || 'S' }}1 → {{ bulkForm.prefix || 'S' }}{{ bulkForm.count }}
              </p>
              @if (bulkFormError()) {
                <p style="font-size:13px;color:#f4212e;margin:0;">{{ bulkFormError() }}</p>
              }
              <div style="display:flex;gap:10px;">
                <button (click)="bulkAddSpots()" [disabled]="bulkSaving()"
                        style="padding:10px 22px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                        [style.opacity]="bulkSaving() ? '.5' : '1'">
                  {{ bulkSaving() ? 'Adding…' : 'Create ' + bulkForm.count + ' Spots' }}
                </button>
                <button (click)="showBulkForm.set(false)"
                        style="padding:10px 20px;border-radius:9999px;background:rgba(255,255,255,.05);color:#71767b;border:1px solid rgba(255,255,255,.08);font-size:14px;cursor:pointer;">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Spot grid -->
        @if (!selectedLotId()) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:56px 24px;text-align:center;">
            <p style="font-size:14px;color:#71767b;margin:0;">Select a lot to manage its spots.</p>
          </div>
        } @else if (loadingSpots()) {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div style="background:rgba(255,255,255,.025);border-radius:12px;height:100px;animation:pulse 1.5s ease-in-out infinite;"></div>
            }
          </div>
        } @else if (allSpots().length === 0) {
          <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:56px 24px;text-align:center;">
            <p style="font-size:14px;color:#71767b;margin:0;">No spots yet. Add some spots above.</p>
          </div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
            @for (spot of allSpots(); track spot.spotId) {
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;border-radius:12px;border:1.5px solid;padding:10px 6px;min-height:100px;transition:opacity 150ms;"
                   [style.background]="spotStatusBg[spot.status] ?? 'rgba(255,255,255,.025)'"
                   [style.border-color]="spotStatusColor[spot.status] ?? 'rgba(255,255,255,.07)'">
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;justify-content:center;gap:2px;">
                  <span style="font-size:13px;font-weight:700;" [style.color]="spotStatusColor[spot.status] ?? '#e7e9ea'">{{ spot.spotNumber }}</span>
                  <span style="font-size:10px;color:#71767b;">F{{ spot.floor }}</span>
                  <span style="font-size:9px;color:#536471;">{{ spot.spotType | slice:0:3 }}</span>
                  <span style="font-size:9px;font-weight:600;color:#71767b;">₹{{ spot.pricePerHour }}/h</span>
                </div>
                <button (click)="deleteSpot(spot.spotId)"
                        style="background:rgba(244,33,46,.1);border:none;cursor:pointer;border-radius:6px;padding:2px 8px;color:#f4212e;font-size:10px;font-weight:600;margin-top:6px;transition:opacity 150ms;"
                        onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'">
                  Remove
                </button>
              </div>
            }
          </div>
        }
      }

    </div>
  `
})
export class ManagerSlotsComponent implements OnInit, OnDestroy {
  private parking  = inject(ParkingService);
  private auth     = inject(AuthService);
  private destroy$ = new Subject<void>();

  readonly spotStatusColor = spotStatusColor;
  readonly spotStatusBg    = spotStatusBg;

  allSpots     = signal<ParkingSpot[]>([]);
  loadingSpots = signal(true);
  loadingLots  = signal(true);

  spotTypes: SpotType[] = ['STANDARD','COMPACT','LARGE','EV_ONLY','HANDICAPPED'];
  legend = [
    { label: 'Available', color: '#00ba7c' },
    { label: 'Reserved',  color: '#ffd400' },
    { label: 'Occupied',  color: '#f4212e' },
  ];

  mgrTab        = signal<'lots' | 'spots'>('lots');
  myLots        = signal<ParkingLot[]>([]);
  selectedLotId = signal<string>('');
  showLotForm   = signal(false);
  showSpotForm  = signal(false);
  lotSaving     = signal(false);
  spotSaving    = signal(false);
  lotFormError  = signal('');
  spotFormError = signal('');

  selectedLot = computed(() => this.myLots().find(l => l.lotId === +this.selectedLotId()) ?? null);

  lotForm = { name: '', address: '', city: '', latitude: 0, longitude: 0, openingTime: '08:00', closingTime: '22:00', maxCapacity: undefined as number | undefined };
  spotForm = { spotNumber: '', floor: 0, spotType: 'STANDARD' as SpotType, pricePerHour: 50, ev: false, handicapped: false };

  showBulkForm  = signal(false);
  bulkSaving    = signal(false);
  bulkFormError = signal('');
  bulkForm = { count: 10, floor: 1, spotType: 'STANDARD' as SpotType, pricePerHour: 50, prefix: '' };

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
      error: err => { this.lotFormError.set(err?.error?.message ?? 'Failed to create lot.'); this.lotSaving.set(false); }
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
      error: err => { this.spotFormError.set(err?.error?.message ?? 'Failed to add spot.'); this.spotSaving.set(false); }
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
      spotNumber: `${prefix}${i + 1}`, floor: this.bulkForm.floor,
      spotType: this.bulkForm.spotType, pricePerHour: this.bulkForm.pricePerHour, status: 'AVAILABLE' as const
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
}
