import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoState, resetDemo, setDemoFailure, type Scenario } from './state';
import { Toaster as RealToaster } from '@/components/ui/sonner';
import './controls.css';
export function Toaster(props: React.ComponentProps<typeof RealToaster>) {
  const qc = useQueryClient(); const navigate = useNavigate(); const [scenario, setScenario] = useState<Scenario>(() => demoState().scenario);
  const [load, setLoad] = useState(demoState().failures.load); const [save, setSave] = useState(demoState().failures.save);
  async function reset(value: Scenario) { await qc.cancelQueries(); resetDemo(value); qc.clear(); setScenario(value); setLoad(value === 'D'); setSave(value === 'D'); await navigate({ to: '/', ignoreBlocker: true }); }
  return <><aside aria-label="Ambiente dimostrativo" className="demo-controls border-b bg-accent px-4 py-3 text-sm text-accent-foreground"><details><summary className="cursor-pointer"><strong>DEMO LOCALE · Dati fittizi</strong> · Scenario {scenario}</summary><div className="mx-auto mt-3 flex max-w-5xl flex-wrap items-center gap-3"><span>Nessun salvataggio online · Reset al ricaricamento</span><label>Scenario <select aria-label="Scenario demo" className="rounded border bg-card p-2" value={scenario} onChange={e => void reset(e.target.value as Scenario)}><option value="A">A · Nuovo utente</option><option value="B">B · Viaggiatore attivo</option><option value="C">C · Esperienze multiple</option><option value="D">D · Errori simulati</option></select></label><Button variant="outline" aria-label="Ripristina scenario" title="Ripristina scenario" onClick={() => void reset(scenario)}><RotateCcw /></Button><label className="flex items-center gap-2"><input type="checkbox" checked={load} onChange={e => { setLoad(e.target.checked); setDemoFailure('load', e.target.checked); void qc.invalidateQueries(); }} />Errore letture</label><label className="flex items-center gap-2"><input type="checkbox" checked={save} onChange={e => { setSave(e.target.checked); setDemoFailure('save', e.target.checked); }} />Errore salvataggi</label></div></details></aside><RealToaster {...props} position="bottom-right" /></>;
}