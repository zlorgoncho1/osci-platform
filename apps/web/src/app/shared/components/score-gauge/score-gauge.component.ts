import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" [ngStyle]="{ width: sizePx + 'px', height: sizePx + 'px' }">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          [attr.stroke-width]="strokeWidth"
        />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          [attr.stroke]="color"
          [attr.stroke-width]="strokeWidth"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          style="transition: stroke-dashoffset 0.6s ease-in-out"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="font-brand font-bold" [ngClass]="textColorClass" [ngStyle]="{ fontSize: fontSize + 'px' }">{{ score }}</span>
        <span class="text-zinc-500" [ngStyle]="{ fontSize: labelSize + 'px' }">/ 100</span>
      </div>
    </div>
  `,
})
export class ScoreGaugeComponent implements OnChanges {
  @Input() score = 0;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  circumference = 2 * Math.PI * 54; // ~339.292
  dashOffset = this.circumference;
  color = '#10B981';
  textColorClass = 'text-emerald-500';
  sizePx = 96;
  strokeWidth = 8;
  fontSize = 24;
  labelSize = 9;

  ngOnChanges(): void {
    this.dashOffset = this.circumference * (1 - this.score / 100);
    this.color = this.getColor(this.score);
    this.textColorClass = this.getTextClass(this.score);

    switch (this.size) {
      case 'sm':
        this.sizePx = 64;
        this.strokeWidth = 6;
        this.fontSize = 16;
        this.labelSize = 7;
        break;
      case 'lg':
        this.sizePx = 128;
        this.strokeWidth = 8;
        this.fontSize = 32;
        this.labelSize = 10;
        break;
      default:
        this.sizePx = 96;
        this.strokeWidth = 8;
        this.fontSize = 24;
        this.labelSize = 9;
    }
  }

  private getColor(score: number): string {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  }

  private getTextClass(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-rose-500';
  }
}
