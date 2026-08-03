import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faSave } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './profile-info.component.html',
  styleUrl: './profile-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileInfoComponent {
  private readonly fb = inject(FormBuilder);

  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly saving = input(false);
  readonly save = output<{ name: string }>();

  readonly faUser = faUser;
  readonly faEnvelope = faEnvelope;
  readonly faSave = faSave;

  readonly profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
  });

  constructor() {
    effect(() => {
      this.profileForm.patchValue({
        name: this.name(),
        email: this.email(),
      }, { emitEvent: false });
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.save.emit({ name: this.profileForm.value.name });
  }
}
