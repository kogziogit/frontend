import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }

  dismiss(id: number) {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(text: string, kind: ToastMessage['kind']) {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 4500);
  }
}
