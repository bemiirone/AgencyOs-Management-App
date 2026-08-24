import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WebSocketService } from './core/services/websocket.service';
import { AuthService } from './core/services/auth.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'web-ui';
  private ws = inject(WebSocketService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.ws.connect();
    }
  }
}
