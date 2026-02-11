import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-glass-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel" [ngClass]="extraClasses">
      <ng-content></ng-content>
    </div>
  `,
})
export class GlassPanelComponent {
  @Input() extraClasses = '';
}
