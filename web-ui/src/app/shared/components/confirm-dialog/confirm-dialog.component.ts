import { Component, ElementRef, ViewChild, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly title = input<string>('Confirm');
  readonly message = input.required<string>();
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly variant = input<string>('error');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @ViewChild('dialogEl') dialogEl!: ElementRef<HTMLDialogElement>;

  open() {
    this.dialogEl.nativeElement.showModal();
  }

  close() {
    this.dialogEl.nativeElement.close();
  }

  onConfirm() {
    this.confirmed.emit();
    this.close();
  }

  onCancel() {
    this.cancelled.emit();
    this.close();
  }
}
