import { Component, input, output, effect, inject } from '@angular/core';
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
})
export class ProfileInfoComponent {
  private fb = inject(FormBuilder);

  name = input.required<string>();
  email = input.required<string>();
  saving = input(false);
  save = output<{ name: string }>();

  faUser = faUser;
  faEnvelope = faEnvelope;
  faSave = faSave;

  profileForm: FormGroup = this.fb.group({
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
