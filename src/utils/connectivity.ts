import { BehaviorSubject } from 'rxjs';

export const isOnline = new BehaviorSubject<boolean>(navigator.onLine);

window.addEventListener('online', () => isOnline.next(true));
window.addEventListener('offline', () => isOnline.next(false));

export const waitForConnection = async (): Promise<void> => {
  if (navigator.onLine) return;
  
  return new Promise((resolve) => {
    const subscription = isOnline.subscribe((online) => {
      if (online) {
        subscription.unsubscribe();
        resolve();
      }
    });
  });
};