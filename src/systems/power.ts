import { createStore } from '../lib/store';

/** TV power state. `warming` = boot sequence running. */
export type PowerState = 'off' | 'warming' | 'on';
export const powerStore = createStore<PowerState>('warming');

/** Imperative hooks registered by <BootSequence/>. */
export const powerApi = {
  powerOn: (_full?: boolean) => {},
  powerOff: () => {},
  skip: () => {},
  instantOn: () => {},
};

export function togglePower() {
  const s = powerStore.get();
  if (s === 'on') powerApi.powerOff();
  else if (s === 'off') powerApi.powerOn(true);
  else powerApi.skip();
}
