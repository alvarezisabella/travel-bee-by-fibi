"use client"
import dynamic from 'next/dynamic';
const CaliforniaMap = dynamic(() => import('./map_view'), { ssr: false });

export default function PlanPage() {
  return (
    <main style={{ width: '70rem', padding: '35px'}}>
      <CaliforniaMap />
    </main>
  );
}