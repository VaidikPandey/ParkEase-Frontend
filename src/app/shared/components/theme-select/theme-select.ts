import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';

export interface ThemeSelectOption {
  label: string;
  value: string;
  meta?: string;
}

@Component({
  selector: 'app-theme-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" [style.width]="width()">
      @if (label()) {
        <label class="block text-[11px] font-bold uppercase text-text-secondary mb-1.5 tracking-[.06em]">
          {{ label() }}
        </label>
      }

      <button type="button"
              (click)="toggle()"
              [disabled]="disabled()"
              class="w-full h-10 px-3 rounded-xl border text-left flex items-center gap-2 transition-all"
              [class.opacity-60]="disabled()"
              style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);">
        <span class="shrink-0 text-accent" [innerHTML]="icon()"></span>
        <span class="flex-1 min-w-0 truncate text-[13px] font-semibold"
              [style.color]="selectedLabel() ? 'var(--text-primary)' : 'var(--text-secondary)'">
          {{ selectedLabel() || placeholder() }}
        </span>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4"
             class="shrink-0 text-text-secondary transition-transform"
             [style.transform]="open() ? 'rotate(180deg)' : 'rotate(0)'">
          <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      @if (open()) {
        <div class="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border shadow-2xl anim-in"
             style="background:var(--bg);border-color:var(--border);box-shadow:0 18px 45px rgba(0,0,0,.28);">
          @if (searchable()) {
            <div class="p-2 border-b" style="border-color:var(--border);">
              <input [value]="query()" (input)="query.set($any($event.target).value)"
                     type="text" placeholder="Search..."
                     class="w-full h-9 px-3 rounded-lg text-[13px] outline-none"
                     style="background:var(--bg-hover);border:1px solid var(--border);color:var(--text-primary);"/>
            </div>
          }

          <div class="max-h-60 overflow-auto p-1">
            @if (allowClear() && value()) {
              <button type="button" (click)="select('')"
                      class="w-full px-3 py-2 rounded-lg text-left text-[13px] font-semibold transition-colors"
                      style="color:var(--text-secondary);">
                {{ clearLabel() }}
              </button>
            }

            @for (option of filteredOptions(); track option.value) {
              <button type="button" (click)="select(option.value)"
                      class="w-full px-3 py-2 rounded-lg text-left flex items-center justify-between gap-3 transition-colors"
                      [style.background]="option.value === value() ? 'var(--accent-dim)' : 'transparent'"
                      [style.color]="option.value === value() ? 'var(--accent)' : 'var(--text-primary)'">
                <span class="min-w-0">
                  <span class="block truncate text-[13px] font-bold">{{ option.label }}</span>
                  @if (option.meta) {
                    <span class="block truncate text-[11px] mt-0.5" style="color:var(--text-secondary);">{{ option.meta }}</span>
                  }
                </span>
                @if (option.value === value()) {
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" class="shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                  </svg>
                }
              </button>
            } @empty {
              <div class="px-3 py-6 text-center text-[13px]" style="color:var(--text-secondary);">No matches</div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ThemeSelectComponent {
  private host = inject(ElementRef<HTMLElement>);

  options = input<ThemeSelectOption[]>([]);
  value = input<string>('');
  label = input('');
  placeholder = input('Select');
  width = input('220px');
  icon = input(`<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s7-4.438 7-11a7 7 0 1 0-14 0c0 6.562 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>`);
  searchable = input(false);
  allowClear = input(true);
  clearLabel = input('All options');
  disabled = input(false);
  valueChange = output<string>();

  open = signal(false);
  query = signal('');

  selectedLabel() {
    return this.options().find(option => option.value === this.value())?.label ?? '';
  }

  filteredOptions() {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.options();
    return this.options().filter(option =>
      option.label.toLowerCase().includes(q) || option.meta?.toLowerCase().includes(q)
    );
  }

  toggle() {
    if (this.disabled()) return;
    this.open.update(open => !open);
  }

  select(value: string) {
    this.valueChange.emit(value);
    this.open.set(false);
    this.query.set('');
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
      this.query.set('');
    }
  }
}
