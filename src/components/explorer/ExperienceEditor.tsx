import { useState } from 'react';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Municipality } from '@/lib/queries';
import { experienceTitle, type Experience } from '@/lib/experiences';
import { refreshExperiences, removeExperience } from '@/lib/experience-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { MediaGallery } from './MediaGallery';
export function ExperienceEditor({userId,city,item,visited}:{userId:string;city:Municipality;item?:Experience | undefined;visited:boolean}) {
 const qc=useQueryClient(); const navigate=useNavigate();
 const [title,setTitle]=useState(item?.title ?? ''); const [date,setDate]=useState(item?.visit_date ?? ''); const [notes,setNotes]=useState(item?.notes ?? '');
 const [saved,setSaved]=useState(JSON.stringify([title,date,notes])); const dirty=JSON.stringify([title,date,notes])!==saved;
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [status,setStatus]=useState(''); const [confirm,setConfirm]=useState(false); const [deleting,setDeleting]=useState(false);
 useBlocker({shouldBlockFn:()=>dirty && !window.confirm('Hai modifiche non salvate. Vuoi lasciare la pagina?'),enableBeforeUnload:dirty});
 async function save(confirmed=false) {
  if(!item && !visited && !confirmed){setConfirm(true);return;}
  setBusy(true);setError('');setStatus('Salvataggio in corso…');
  try {
   let id=item?.id;
   if(item) {
    const result=await supabase.from('visit_experiences').update({title:experienceTitle(title),visit_date:date || null,notes:notes || null}).eq('user_id',userId).eq('id',item.id).eq('deleting',false).select('id').single();
    if(result.error) throw result.error;
   } else {
    const result=await supabase.rpc('create_my_experience',{_city_id:city.id,_title:title,_visit_date:(date || null) as unknown as string,_notes:(notes || null) as unknown as string,_confirm_visit:confirmed});
    if(result.error) throw result.error; id=result.data.id;
   }
   setSaved(JSON.stringify([title,date,notes]));setStatus('Salvato'); refreshExperiences(qc,userId);
   if(!item && id) await navigate({to:'/esperienza/$id',params:{id},ignoreBlocker:true});
  } catch {setError('Salvataggio non riuscito. Riprova.');setStatus('');} finally {setBusy(false);setConfirm(false);}
 }
 async function remove() {
  if(!item) return; setBusy(true);setError('');
  try {await removeExperience(userId,item.id);refreshExperiences(qc,userId);await navigate({to:'/comune/$slug',params:{slug:city.slug},ignoreBlocker:true});}
  catch {refreshExperiences(qc,userId);setError('Eliminazione incompleta. I file già rimossi non possono essere recuperati; riprova per completarla.');}
  finally {setBusy(false);setDeleting(false);}
 }
 return <div className="space-y-8">
  {item?.deleting ? <div role="alert" className="space-y-3"><p className="text-destructive">Eliminazione da completare. Questa esperienza non compare nel Diario.</p><Button variant="destructive" disabled={busy} onClick={()=>setDeleting(true)}>Completa eliminazione</Button></div> : <>
   <form className="space-y-5" onSubmit={e=>{e.preventDefault();void save();}}>
    <label className="block space-y-2"><span className="text-sm font-semibold">Titolo dell’esperienza</span><Input aria-label="Titolo dell’esperienza" value={title} maxLength={200} placeholder="Ricordo di viaggio" onChange={e=>setTitle(e.target.value)} /></label>
    <label className="block space-y-2"><span className="text-sm font-semibold">Data della visita (facoltativa)</span><Input type="date" aria-label="Data della visita" value={date} onChange={e=>setDate(e.target.value)} /></label>
    <label className="block space-y-2"><span className="text-sm font-semibold">Note personali</span><Textarea aria-label="Note personali" value={notes} rows={6} maxLength={5000} onChange={e=>setNotes(e.target.value)} /></label>
    <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">{status || (dirty ? 'Modifiche non salvate' : '')}</p><Button type="submit" disabled={busy || (!!item && !dirty)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{item ? 'Salva esperienza' : 'Crea esperienza'}</Button></div>
   </form>
   {item && <><MediaGallery userId={userId} istat={city.istat_code} experienceId={item.id} /><Button variant="ghost" className="text-destructive" disabled={busy} onClick={()=>setDeleting(true)}><Trash2 />Elimina esperienza</Button></>}
  </>}
  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Segnare {city.name} come visitata?</AlertDialogTitle><AlertDialogDescription>Creando questa esperienza, la città sarà anche segnata come visitata.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={()=>void save(true)}>Conferma e salva</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  <AlertDialog open={deleting} onOpenChange={setDeleting}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminare questa esperienza?</AlertDialogTitle><AlertDialogDescription>Note, fotografie e video di questa esperienza saranno eliminati definitivamente. Le altre esperienze e lo stato della città resteranno invariati.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={()=>void remove()}>Elimina esperienza e media</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}
