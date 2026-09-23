'use client';
import React, { useEffect, useState } from "react";
import { ItineraryUpdate } from "../types/types";
import { getItineraryUpdates } from "@/lib/hooks/updates";


type Props = { trip: string };

const actionStyles: Record<string, { bg: string; color: string; label: string }> = {
  Added:   { bg: '#E1F5EE', color: '#085041', label: 'added' },
  Edited:  { bg: '#E6F1FB', color: '#0C447C', label: 'edited' },
  Removed: { bg: '#FCEBEB', color: '#791F1F', label: 'removed' },
};

const avatarColors = [
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#FBEAF0', color: '#72243E' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const i = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[i];
}

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TripUpdates({ trip }: Props) {
  const [updates, setUpdates] = useState<ItineraryUpdate[]>([]);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    getItineraryUpdates(trip).then(setUpdates);
  }, [trip]);

  if(cleared) return null

  return (
    <div className= "" style={{ padding: '1rem 0',
        borderRadius: "10px",
        borderColor: "rgba(250, 197, 37, 0.4)",
        boxShadow: "0px 2px 10px rgba(217, 178, 60, 0.4)" 
    }}>
      <p style={{ padding: "0rem 1rem", fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Recent activity
      </p>

      {updates.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No updates yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', padding: '0rem 1rem'}}>

        {updates.map((update, i) => {
          const avatar = getAvatarColor(update.username ?? '');
          const badge = actionStyles[update.action] ?? { bg: '#F1EFE8', color: '#444441', label: update.action };
          const isLast = i === updates.length - 1;

          return (
            <div key={update.id} style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatar.bg, color: avatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                  {getInitials(update.username ?? '?')}
                </div>
                {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--color-border-tertiary)', margin: '4px 0' }} />}
              </div>

              <div style={{ paddingBottom: isLast ? 4 : 16, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {update.username}
                  </span>
                  <span style={{ fontSize: 11, background: badge.bg, color: badge.color, borderRadius: 4, padding: '1px 6px' }}>
                    {badge.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                    {formatTime(update.timestamp)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  {update.title}
                </p>
              </div>
            </div>
          );
        })}
        <button
            onClick={() => setCleared(true)}
            style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
        >
            Dismiss
        </button>
      </div>
    </div>
  );
}