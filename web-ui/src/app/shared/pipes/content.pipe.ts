import { Pipe, PipeTransform, inject } from '@angular/core';
import { ContentStore } from '../../stores/content.store';

@Pipe({
  name: 'content',
  standalone: true,
})
export class ContentPipe implements PipeTransform {
  private store = inject(ContentStore);

  transform(key: string): string {
    return this.store.content(key);
  }
}
