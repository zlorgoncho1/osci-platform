import { Component, EventEmitter, Input, OnInit, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="relative">
      <select
        [ngModel]="value || ''"
        (ngModelChange)="onSelectionChange($event)"
        class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors appearance-none pr-7"
        [class.text-zinc-600]="!value">
        <option value="">{{ placeholder }}</option>
        <option *ngFor="let u of users" [value]="u.id">
          {{ u.firstName || '' }} {{ u.lastName || '' }} ({{ u.email }})
        </option>
      </select>
      <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <iconify-icon icon="solar:alt-arrow-down-linear" width="12" class="text-zinc-500"></iconify-icon>
      </div>
    </div>
  `,
})
export class UserPickerComponent implements OnInit {
  @Input() value: string | null = null;
  @Input() placeholder = 'Select user...';
  @Output() valueChange = new EventEmitter<string | null>();

  users: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getUsers().subscribe({
      next: (users) => {
        this.users = (users || []).filter((u: any) => u.enabled !== false);
      },
      error: () => {
        this.users = [];
      },
    });
  }

  onSelectionChange(val: string): void {
    this.valueChange.emit(val || null);
  }
}
