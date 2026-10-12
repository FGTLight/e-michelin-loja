'use client';

import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { mapsDirectionsUrl, mapsEmbedUrl, site, whatsappLink } from '@/config/site';

/** Localização e contato. O iframe do mapa só carrega quando a seção se aproxima da tela. */
export function Location() {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setLoad(true), io.disconnect()), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="contato" className="container py-16 sm:py-20" aria-labelledby="loc-title">
      <div className="grid overflow-hidden rounded-3xl bg-white shadow-card lg:grid-cols-[1fr_1.4fr]">
        <div className="p-6 sm:p-10">
          <p className="eyebrow">Localização e contato</p>
          <h2 id="loc-title" className="section-title mt-2">Venha nos visitar</h2>
          <ul className="mt-8 space-y-5">
            <li className="flex gap-4">
              <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-seguranca-600" aria-hidden />
              <div>
                <p className="font-bold text-petroleo-950">Endereço</p>
                <address className="not-italic text-cimento-800">{site.address.full}</address>
              </div>
            </li>
            <li className="flex gap-4">
              <Clock className="mt-0.5 h-6 w-6 shrink-0 text-seguranca-600" aria-hidden />
              <div>
                <p className="font-bold text-petroleo-950">Horário de atendimento</p>
                <dl className="text-cimento-800">
                  {site.hours.map((h) => (
                    <div key={h.days} className="flex gap-2">
                      <dt>{h.days}:</dt>
                      <dd className="font-semibold">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-0.5 h-6 w-6 shrink-0 text-seguranca-600" aria-hidden />
              <div>
                <p className="font-bold text-petroleo-950">Telefone</p>
                <a href={`tel:${site.phoneE164}`} className="text-lg font-semibold text-petroleo-800 hover:underline">{site.phone}</a>
              </div>
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsappLink('Olá! Gostaria de falar com um vendedor.')} target="_blank" rel="noopener noreferrer" className="btn bg-[#15803d] text-white hover:bg-[#166534]">
              Chamar no WhatsApp
            </a>
            <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <Navigation className="h-4 w-4" aria-hidden /> Como chegar
            </a>
          </div>
        </div>
        <div ref={ref} className="relative min-h-[320px] bg-cimento-200">
          {load ? (
            <iframe
              title={`Mapa: ${site.name}, ${site.address.full}`}
              src={mapsEmbedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="skeleton absolute inset-0 rounded-none" aria-hidden />
          )}
        </div>
      </div>
    </section>
  );
}
