import {useState} from 'react';
import {Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {Plus,ChevronRight,Images,Film} from 'lucide-react';
import {experiencesQuery,experiencePreviewsQuery} from '@/lib/experience-queries';
import {sortExperiences} from '@/lib/experiences';
import type {Municipality} from '@/lib/queries';
import {Button} from '@/components/ui/button';
import {DiaryCover} from './DiaryCover';
export function CityExperiences({userId,city}:{userId:string;city:Municipality}) {
 const q=useQuery(experiencesQuery(userId));const [page,setPage]=useState(1);
 const rows=sortExperiences((q.data ?? []).filter(e=>e.istat_code===city.istat_code));const visible=rows.slice((page-1)*12,page*12);
 const preview=useQuery(experiencePreviewsQuery(userId,visible.map(e=>e.id)));const byId=new Map(preview.data?.map(p=>[p.id,p]));
 return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Le mie esperienze</h2><Button asChild><Link to="/esperienza/$id" params={{id:'nuova'}} search={{city:city.id}}><Plus/>Nuova esperienza</Link></Button></div>
 {q.isPending && <p role="status">Caricamento esperienze…</p>}{q.isError && <div role="alert">Impossibile caricare le esperienze.<Button variant="outline" onClick={()=>q.refetch()}>Riprova</Button></div>}
 {preview.isError && <div role="alert" className="text-sm text-destructive">Impossibile caricare le anteprime.<Button variant="ghost" onClick={()=>preview.refetch()}>Riprova</Button></div>}
 {!q.isPending && !q.isError && !rows.length && <p className="py-8 text-center text-muted-foreground">Nessuna esperienza registrata.</p>}
 <div className="grid gap-3 sm:grid-cols-2">{visible.map(item=>{const media=byId.get(item.id);return <Link key={item.id} to="/esperienza/$id" params={{id:item.id}} className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-card"><DiaryCover name={city.name} coatUrl={city.coat_of_arms_url} photo={media?.photo} pending={preview.isPending} onRetry={()=>{if(!preview.isFetching) void preview.refetch();}}/><div className="space-y-2 p-4"><h3 className="break-words text-2xl font-semibold">{item.title}</h3>{item.deleting ? <p className="text-sm text-destructive">Eliminazione da completare</p> : <>{item.visit_date && <time className="text-sm text-muted-foreground">{new Date(`${item.visit_date}T12:00:00`).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}</time>}{item.notes && <p className="line-clamp-2 break-words text-sm">{item.notes}</p>}<div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Images className="h-3 w-3"/>{media?.photos ?? '—'} foto</span><span className="flex items-center gap-1"><Film className="h-3 w-3"/>{media?.videos ?? '—'} video</span><ChevronRight className="ml-auto h-4 w-4"/></div></>}</div></Link>;})}</div>
 {rows.length>12 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Precedente</Button><span>{page} / {Math.ceil(rows.length/12)}</span><Button variant="outline" disabled={page*12>=rows.length} onClick={()=>setPage(p=>p+1)}>Successiva</Button></div>}
 </section>;
}
