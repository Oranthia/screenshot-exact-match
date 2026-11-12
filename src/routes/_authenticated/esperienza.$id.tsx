import {createFileRoute,Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {ChevronLeft} from 'lucide-react';
import {useAuth} from '@/lib/auth';
import {geoQuery,visitsQuery} from '@/lib/queries';
import {experiencesQuery} from '@/lib/experience-queries';
import {AppHeader} from '@/components/explorer/AppHeader';
import {ExperienceEditor} from '@/components/explorer/ExperienceEditor';
import {Button} from '@/components/ui/button';
export const Route=createFileRoute('/_authenticated/esperienza/$id')({validateSearch:(s:Record<string,unknown>):{city?:string}=>({city:typeof s['city']==='string'?s['city']:''}),head:()=>({meta:[{title:'Esperienza di viaggio — Italia Explorer'},{name:'description',content:'Date, note e ricordi privati della tua esperienza in Italia.'},{property:'og:title',content:'Esperienza di viaggio — Italia Explorer'},{property:'og:description',content:'I tuoi ricordi di viaggio personali.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){
 const {id}=Route.useParams();const search=Route.useSearch();const {session}=useAuth();const userId=session?.user.id ?? '';
 const geo=useQuery(geoQuery);const experiences=useQuery({...experiencesQuery(userId),enabled:!!userId});const visits=useQuery({...visitsQuery(userId),enabled:!!userId});
 const item=experiences.data?.find(e=>e.id===id);const city=geo.data?.municipalities.find(c=>id==='nuova'?c.id===search.city:c.id===item?.city_id);
 return <div><AppHeader/><main className="mx-auto max-w-3xl space-y-6 px-4 py-6">{geo.isError || experiences.isError || visits.isError ? <div role="alert">Impossibile caricare l’esperienza.<Button variant="outline" onClick={()=>{void geo.refetch();void experiences.refetch();void visits.refetch();}}>Riprova</Button></div> : !geo.data || !experiences.data || !visits.data ? <p role="status">Caricamento esperienza…</p> : !city || (id!=='nuova' && !item) ? <h1 className="text-3xl">Esperienza non trovata</h1> : <><Link to="/comune/$slug" params={{slug:city.slug}} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="h-4 w-4"/>{city.name}</Link><header><p className="text-sm text-gold-foreground">{city.name}</p><h1 className="break-words text-4xl font-semibold">{item?.title ?? 'Nuova esperienza'}</h1></header><ExperienceEditor key={item?.id ?? city.id} userId={userId} city={city} item={item} visited={visits.data.some(v=>v.istat_code===city.istat_code && v.visited)}/></>}</main></div>;
}
