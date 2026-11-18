import { useStore } from '../../lib/store';
import { osdStore } from '../../systems/osd';

/** Classic green TV on-screen display. */
export function OSD() {
  const msg = useStore(osdStore);
  if (!msg) return null;
  return (
    <div className="crt-osd" key={msg.id} role="status" aria-live="polite">
      {msg.text}
      {msg.sub && <small>{msg.sub}</small>}
      {msg.bars !== undefined && (
        <div className="crt-osd__bars" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={i < (msg.bars ?? 0) ? '' : 'off'} />
          ))}
        </div>
      )}
    </div>
  );
}
