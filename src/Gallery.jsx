import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { PageHero, Seo, CTABand } from '../components/UI.jsx';
import { Visual } from '../components/Art.jsx';
import { gallery } from '../data/content.js';

export default function Gallery() {
  const [idx, setIdx] = useState(-1);
  const open = idx >= 0;
  const go = (d) => setIdx((i) => (i + d + gallery.length) % gallery.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIdx(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  const hasPhotos = gallery.some((g) => g.photo);
  return (
    <>
      <Seo title="Gallery" path="/gallery" description="Gallery of trips, vehicles and destinations from Narayan Tours & Travels." />
      <PageHero title="Gallery" text="Moments from the road — pilgrimages, Konkan coast trips, ghats and city tours." />
      <section className="container-x py-16">
        {!hasPhotos && (
          <p className="mb-6 flex items-start gap-2 rounded-xl bg-gold-100 px-4 py-3 text-sm text-navy-900 ring-1 ring-gold-300">
            <Info className="h-4 w-4 mt-0.5 shrink-0" /> Illustrations shown. Add your own trip and vehicle photos in <code className="font-mono">src/data/content.js</code> (gallery list).
          </p>
        )}
        <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
          {gallery.map((g, i) => (
            <li key={i} className="break-inside-avoid">
              <button type="button" onClick={() => setIdx(i)} className="group relative block w-full overflow-hidden rounded-3xl shadow-card focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold-400">
                <Visual photo={g.photo} scene={g.scene} seed={i} alt={g.caption} className={`w-full ${i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'} transition duration-700 group-hover:scale-105`} />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-4 pt-12 text-left font-display font-semibold text-white">{g.caption}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={gallery[idx].caption} className="fixed inset-0 z-50 grid place-items-center bg-navy-950/95 p-4" onClick={() => setIdx(-1)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Visual photo={gallery[idx].photo} scene={gallery[idx].scene} alt={gallery[idx].caption} className="w-full aspect-[16/10] rounded-2xl" />
            <p className="mt-3 text-center font-display text-lg text-white">{gallery[idx].caption} <span className="text-navy-300">· {idx + 1}/{gallery.length}</span></p>
            <button type="button" autoFocus onClick={() => setIdx(-1)} aria-label="Close" className="absolute -top-3 -right-3 grid h-11 w-11 place-items-center rounded-full bg-white text-navy-900"><X className="h-5 w-5" /></button>
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-navy-900"><ChevronLeft className="h-6 w-6" /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-navy-900"><ChevronRight className="h-6 w-6" /></button>
          </div>
        </div>
      )}
      <CTABand />
    </>
  );
}
