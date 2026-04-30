import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, AddVehicleRequest } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Vehicle } from '../../core/models/parking.models';

const TYPE_COLOR: Record<string, string> = {
  SEDAN: '#1d9bf0', SUV: '#7c3aed', MOTORCYCLE: '#f59e0b',
  TRUCK: '#ef4444', VAN: '#10b981', OTHER: '#6b7280'
};

// Single reusable SVG path for all vehicle types
const CAR_PATH = 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:960px;margin:0 auto;padding:28px 24px;min-height:100%;" class="anim-in">

      <!-- ══ DRIVER VIEW ══ -->
      @if (role === 'DRIVER') {

        <!-- Header -->
        <div style="margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.4px;">My Garage</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">{{ vehicles().length }} vehicle{{ vehicles().length !== 1 ? 's' : '' }} registered</p>
        </div>

        <!-- Add form -->
        @if (showForm()) {
          <div style="background:linear-gradient(135deg,rgba(29,155,240,.06),rgba(29,155,240,.01));border:1px solid rgba(29,155,240,.18);border-radius:20px;padding:24px;margin-bottom:24px;" class="anim-in">

            <!-- Form header -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;border-radius:10px;background:rgba(29,155,240,.12);display:flex;align-items:center;justify-content:center;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="carPath"/></svg>
                </div>
                <span style="font-size:15px;font-weight:700;color:#e7e9ea;">Register New Vehicle</span>
              </div>
              <button (click)="closeForm()" type="button"
                      style="background:none;border:none;cursor:pointer;color:#536471;padding:6px;border-radius:8px;display:flex;align-items:center;transition:color 150ms;"
                      onmouseenter="this.style.color='#e7e9ea'" onmouseleave="this.style.color='#536471'">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Type picker -->
            <div style="margin-bottom:20px;">
              <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:10px;letter-spacing:.07em;text-transform:uppercase;">Vehicle Type</label>
              <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">
                @for (t of vehicleTypes; track t.value) {
                  <button (click)="form.vehicleType = t.value" type="button"
                          style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 4px;border-radius:14px;cursor:pointer;border:1.5px solid;transition:all 180ms;font-size:11px;font-weight:700;letter-spacing:.03em;"
                          [style.border-color]="form.vehicleType === t.value ? typeColor(t.value) : 'rgba(255,255,255,.07)'"
                          [style.background]="form.vehicleType === t.value ? typeColor(t.value) + '18' : 'rgba(255,255,255,.02)'"
                          [style.color]="form.vehicleType === t.value ? typeColor(t.value) : '#536471'">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                         [attr.stroke]="form.vehicleType === t.value ? typeColor(t.value) : '#536471'">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="carPath"/>
                    </svg>
                    <span>{{ t.label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Plate + Nickname -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;">
              <div>
                <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:8px;letter-spacing:.07em;text-transform:uppercase;">
                  Plate Number <span style="color:#f4212e;">*</span>
                </label>
                <input [(ngModel)]="form.plate"
                       name="plate" type="text" placeholder="MH01AB1234" maxlength="15" autocomplete="off"
                       style="width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;font-size:15px;font-weight:700;color:#e7e9ea;outline:none;box-sizing:border-box;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;transition:border-color 180ms,background 180ms;"
                       onfocus="this.style.borderColor='#1d9bf0';this.style.background='rgba(29,155,240,.05)'"
                       onblur="this.style.borderColor='rgba(255,255,255,.1)';this.style.background='rgba(255,255,255,.05)'"/>
              </div>
              <div>
                <label style="display:block;font-size:11px;color:#71767b;font-weight:700;margin-bottom:8px;letter-spacing:.07em;text-transform:uppercase;">
                  Nickname <span style="color:#536471;font-weight:400;">(optional)</span>
                </label>
                <input [(ngModel)]="form.nickname" name="nickname" type="text" placeholder="e.g. My Daily"
                       style="width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;font-size:14px;color:#e7e9ea;outline:none;box-sizing:border-box;transition:border-color 180ms,background 180ms;"
                       onfocus="this.style.borderColor='#1d9bf0';this.style.background='rgba(29,155,240,.05)'"
                       onblur="this.style.borderColor='rgba(255,255,255,.1)';this.style.background='rgba(255,255,255,.05)'"/>
              </div>
            </div>

            <!-- EV toggle -->
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:14px 16px;background:rgba(255,255,255,.03);border-radius:12px;border:1px solid rgba(255,255,255,.06);">
              <button (click)="form.ev = !form.ev" type="button"
                      style="width:44px;height:26px;border-radius:9999px;border:none;cursor:pointer;padding:3px;transition:background 250ms;flex-shrink:0;display:flex;align-items:center;"
                      [style.background]="form.ev ? '#00ba7c' : 'rgba(255,255,255,.12)'">
                <span style="width:20px;height:20px;border-radius:50%;background:#fff;display:block;transition:transform 250ms;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.3);"
                      [style.transform]="form.ev ? 'translateX(18px)' : 'translateX(0)'"></span>
              </button>
              <div style="display:flex;align-items:center;gap:10px;">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#00ba7c" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                </svg>
                <div>
                  <p style="font-size:13px;font-weight:700;color:#e7e9ea;margin:0;">Electric Vehicle</p>
                  <p style="font-size:11px;color:#71767b;margin:0;">Eligible for EV-only spots</p>
                </div>
              </div>
            </div>

            @if (formError()) {
              <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(244,33,46,.07);border:1px solid rgba(244,33,46,.2);margin-bottom:16px;" class="anim-in">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                <span style="font-size:13px;color:#f4212e;font-weight:600;">{{ formError() }}</span>
              </div>
            }

            <div style="display:flex;gap:10px;">
              <button (click)="addVehicle()" [disabled]="saving()"
                      style="flex:1;padding:13px;border-radius:12px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;"
                      [style.opacity]="saving() ? '.5' : '1'">
                {{ saving() ? 'Registering…' : 'Register Vehicle' }}
              </button>
              <button (click)="closeForm()" type="button"
                      style="padding:13px 20px;border-radius:12px;background:rgba(255,255,255,.05);color:#71767b;border:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:600;cursor:pointer;">
                Cancel
              </button>
            </div>
          </div>
        }

        <!-- Loading -->
        @if (loading()) {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
            @for (i of [1,2,3]; track i) {
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:20px;height:190px;animation:pulse 1.5s ease-in-out infinite;"></div>
            }
          </div>

        <!-- Empty state -->
        } @else if (vehicles().length === 0 && !showForm()) {
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:80px 24px;" class="anim-in">
            <div style="width:72px;height:72px;border-radius:20px;background:rgba(29,155,240,.08);border:1px solid rgba(29,155,240,.15);display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
              <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="1.3"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="carPath"/></svg>
            </div>
            <h3 style="font-size:18px;font-weight:800;color:#e7e9ea;margin:0 0 8px;">No vehicles yet</h3>
            <p style="font-size:14px;color:#71767b;margin:0 0 24px;max-width:280px;line-height:1.6;">Register your first vehicle to start booking parking spots.</p>
            <button (click)="showForm.set(true)"
                    style="padding:12px 28px;border-radius:9999px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:opacity 150ms;"
                    onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              Add Your First Vehicle
            </button>
          </div>

        <!-- Vehicle grid -->
        } @else {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;" class="anim-in anim-d1">

            @for (v of vehicles(); track v.id) {
              <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:20px;overflow:hidden;transition:border-color 150ms,transform 150ms,box-shadow 150ms;"
                   onmouseenter="this.style.borderColor='rgba(255,255,255,.13)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 32px rgba(0,0,0,.28)'"
                   onmouseleave="this.style.borderColor='rgba(255,255,255,.07)';this.style.transform='translateY(0)';this.style.boxShadow='none'">

                <!-- Type color strip -->
                <div style="height:3px;" [style.background]="typeColor(v.vehicleType)"></div>

                <div style="padding:20px;">
                  <!-- Icon + delete row -->
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
                    <div style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;"
                         [style.background]="typeColor(v.vehicleType) + '15'">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                           [attr.stroke]="typeColor(v.vehicleType)">
                        <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="carPath"/>
                      </svg>
                    </div>
                    <button (click)="confirmRemove.set(v)"
                            style="background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;color:#536471;transition:color 150ms,background 150ms;display:flex;"
                            onmouseenter="this.style.color='#f4212e';this.style.background='rgba(244,33,46,.08)'"
                            onmouseleave="this.style.color='#536471';this.style.background='transparent'">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Plate & nickname -->
                  <p style="font-size:19px;font-weight:800;color:#e7e9ea;margin:0 0 4px;font-family:monospace;letter-spacing:.08em;">{{ v.plate }}</p>
                  <p style="font-size:12px;color:#71767b;margin:0 0 14px;">{{ v.nickname || '—' }}</p>

                  <!-- Badges -->
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:9999px;letter-spacing:.05em;text-transform:uppercase;"
                          [style.background]="typeColor(v.vehicleType) + '18'"
                          [style.color]="typeColor(v.vehicleType)">{{ v.vehicleType }}</span>
                    @if (v.ev) {
                      <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:9999px;background:rgba(0,186,124,.12);color:#00ba7c;display:flex;align-items:center;gap:3px;">
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="#00ba7c" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
                        EV
                      </span>
                    }
                    <span style="font-size:10px;color:#536471;margin-left:auto;">{{ v.createdAt | date:'dd MMM yy' }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Add card -->
            @if (!showForm()) {
              <button (click)="showForm.set(true)"
                      style="background:rgba(255,255,255,.02);border:1.5px dashed rgba(255,255,255,.1);border-radius:20px;cursor:pointer;transition:all 180ms;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:190px;"
                      onmouseenter="this.style.borderColor='rgba(29,155,240,.4)';this.style.background='rgba(29,155,240,.04)'"
                      onmouseleave="this.style.borderColor='rgba(255,255,255,.1)';this.style.background='rgba(255,255,255,.02)'">
                <div style="width:40px;height:40px;border-radius:12px;background:rgba(29,155,240,.1);display:flex;align-items:center;justify-content:center;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1d9bf0" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                </div>
                <span style="font-size:13px;font-weight:700;color:#71767b;">Add Vehicle</span>
              </button>
            }
          </div>
        }
      }

      <!-- ══ ADMIN / MANAGER VIEW ══ -->
      @if (role === 'ADMIN' || role === 'MANAGER') {
        <div style="margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:800;color:#e7e9ea;margin:0 0 4px;letter-spacing:-.4px;">Vehicle Lookup</h1>
          <p style="font-size:13px;color:#71767b;margin:0;">Search any registered vehicle by plate number</p>
        </div>

        <div style="max-width:520px;">
          <div style="display:flex;gap:10px;margin-bottom:16px;">
            <input [(ngModel)]="lookupPlate" name="lookup"
                   type="text" placeholder="MH01AB1234"
                   (keydown.enter)="lookupByPlate()"
                   style="flex:1;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 18px;font-size:15px;font-weight:700;color:#e7e9ea;outline:none;font-family:monospace;letter-spacing:.08em;text-transform:uppercase;transition:border-color 180ms;"
                   onfocus="this.style.borderColor='#1d9bf0'" onblur="this.style.borderColor='rgba(255,255,255,.1)'"/>
            <button (click)="lookupByPlate()" [disabled]="lookupLoading()"
                    style="padding:13px 24px;border-radius:12px;background:#1d9bf0;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 150ms;white-space:nowrap;"
                    [style.opacity]="lookupLoading() ? '.5' : '1'">
              {{ lookupLoading() ? 'Searching…' : 'Search' }}
            </button>
          </div>

          @if (lookupError()) {
            <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;background:rgba(244,33,46,.06);border:1px solid rgba(244,33,46,.15);" class="anim-in">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
              <span style="font-size:13px;color:#f4212e;font-weight:600;">{{ lookupError() }}</span>
            </div>
          }

          @if (lookupResult()) {
            <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.1);border-radius:20px;overflow:hidden;" class="anim-in">
              <div style="height:3px;" [style.background]="typeColor(lookupResult()!.vehicleType)"></div>
              <div style="padding:20px;display:flex;align-items:center;gap:16px;">
                <div style="width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
                     [style.background]="typeColor(lookupResult()!.vehicleType) + '15'">
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                       [attr.stroke]="typeColor(lookupResult()!.vehicleType)">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="carPath"/>
                  </svg>
                </div>
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">
                    <p style="font-size:18px;font-weight:800;color:#e7e9ea;margin:0;font-family:monospace;letter-spacing:.08em;">{{ lookupResult()!.plate }}</p>
                    <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:9999px;text-transform:uppercase;"
                          [style.background]="typeColor(lookupResult()!.vehicleType) + '18'"
                          [style.color]="typeColor(lookupResult()!.vehicleType)">{{ lookupResult()!.vehicleType }}</span>
                    @if (lookupResult()!.ev) {
                      <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:9999px;background:rgba(0,186,124,.12);color:#00ba7c;">EV</span>
                    }
                  </div>
                  <p style="font-size:13px;color:#71767b;margin:0;">{{ lookupResult()!.nickname || 'No nickname' }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ══ REMOVE MODAL ══ -->
      @if (confirmRemove()) {
        <div style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);">
          <div style="background:#111;border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:28px;width:100%;max-width:340px;" class="anim-in">
            <div style="width:48px;height:48px;border-radius:14px;background:rgba(244,33,46,.1);border:1px solid rgba(244,33,46,.2);display:flex;align-items:center;justify-content:center;margin-bottom:18px;">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f4212e" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
              </svg>
            </div>
            <h3 style="font-size:17px;font-weight:800;color:#e7e9ea;margin:0 0 8px;">Remove Vehicle?</h3>
            <p style="font-size:13px;color:#71767b;margin:0 0 24px;line-height:1.65;">
              <strong style="color:#e7e9ea;font-family:monospace;letter-spacing:.06em;">{{ confirmRemove()!.plate }}</strong> will be removed from your garage.
            </p>
            <div style="display:flex;gap:10px;">
              <button (click)="deleteVehicle(confirmRemove()!.id)"
                      style="flex:1;padding:12px;border-radius:12px;background:rgba(244,33,46,.1);color:#f4212e;border:1px solid rgba(244,33,46,.2);font-size:14px;font-weight:700;cursor:pointer;transition:background 150ms;"
                      onmouseenter="this.style.background='rgba(244,33,46,.2)'" onmouseleave="this.style.background='rgba(244,33,46,.1)'">
                Remove
              </button>
              <button (click)="confirmRemove.set(null)"
                      style="flex:1;padding:12px;border-radius:12px;background:rgba(255,255,255,.05);color:#e7e9ea;border:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:600;cursor:pointer;">
                Keep
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class VehicleComponent implements OnInit {
  private vehicleSvc = inject(VehicleService);
  private auth       = inject(AuthService);
  private toast      = inject(ToastService);

  readonly carPath = CAR_PATH;

  role = this.auth.currentUser()?.role;

  vehicles      = signal<Vehicle[]>([]);
  loading       = signal(true);
  showForm      = signal(false);
  saving        = signal(false);
  formError     = signal('');
  confirmRemove = signal<Vehicle | null>(null);

  lookupPlate   = '';
  lookupLoading = signal(false);
  lookupResult  = signal<Vehicle | null>(null);
  lookupError   = signal('');

  vehicleTypes = [
    { value: 'SEDAN',      label: 'Sedan' },
    { value: 'SUV',        label: 'SUV'   },
    { value: 'MOTORCYCLE', label: 'Moto'  },
    { value: 'TRUCK',      label: 'Truck' },
    { value: 'VAN',        label: 'Van'   },
    { value: 'OTHER',      label: 'Other' },
  ];

  form: { plate: string; vehicleType: string; ev: boolean; nickname: string } = {
    plate: '', vehicleType: 'SEDAN', ev: false, nickname: ''
  };

  ngOnInit() {
    if (this.role === 'DRIVER') this.loadVehicles();
    else this.loading.set(false);
  }

  loadVehicles() {
    this.loading.set(true);
    this.vehicleSvc.getMyVehicles().subscribe({
      next: v  => { this.vehicles.set(v); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load vehicles.'); }
    });
  }

  addVehicle() {
    const plate = this.form.plate.trim().toUpperCase();
    if (!plate) { this.formError.set('Plate number is required.'); return; }
    this.saving.set(true);
    this.formError.set('');
    const req: AddVehicleRequest = {
      plate,
      vehicleType: this.form.vehicleType,
      ev:          this.form.ev,
      nickname:    this.form.nickname.trim() || undefined
    };
    this.vehicleSvc.addVehicle(req).subscribe({
      next: v => {
        this.vehicles.update(list => [v, ...list]);
        this.form = { plate: '', vehicleType: 'SEDAN', ev: false, nickname: '' };
        this.showForm.set(false);
        this.saving.set(false);
        this.toast.success('Vehicle registered.');
      },
      error: err => {
        this.formError.set(err?.error?.message ?? 'Failed to register vehicle.');
        this.saving.set(false);
      }
    });
  }

  deleteVehicle(id: number) {
    this.vehicleSvc.deleteVehicle(id).subscribe({
      next: () => {
        this.vehicles.update(list => list.filter(v => v.id !== id));
        this.confirmRemove.set(null);
        this.toast.success('Vehicle removed.');
      },
      error: err => {
        this.confirmRemove.set(null);
        this.toast.error(err?.error?.message ?? 'Failed to remove vehicle.');
      }
    });
  }

  lookupByPlate() {
    const plate = this.lookupPlate.trim().toUpperCase();
    if (!plate) return;
    this.lookupLoading.set(true);
    this.lookupError.set('');
    this.lookupResult.set(null);
    this.vehicleSvc.getByPlate(plate).subscribe({
      next: v  => { this.lookupResult.set(v); this.lookupLoading.set(false); },
      error: () => { this.lookupError.set('No vehicle found with that plate.'); this.lookupLoading.set(false); }
    });
  }

  closeForm() {
    this.showForm.set(false);
    this.formError.set('');
    this.form = { plate: '', vehicleType: 'SEDAN', ev: false, nickname: '' };
  }

  typeColor(type: string) { return TYPE_COLOR[type] ?? '#1d9bf0'; }
}
