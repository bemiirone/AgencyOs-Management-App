import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { WorkspaceSelectModalComponent } from '../../shared/components/workspace-select-modal/workspace-select-modal.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, FontAwesomeModule, SidebarComponent, HeaderComponent, ToastComponent, WorkspaceSelectModalComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private authService = inject(AuthService);

  drawerOpen = false;
  showWorkspaceSelect = false;

  ngOnInit() {
    this.showWorkspaceSelect = this.authService.getShowWorkspaceSelect()();
  }

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
  }
}
