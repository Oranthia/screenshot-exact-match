import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Experience } from './experiences';
import type { VisitMedia } from './queries';
export const experiencesQuery = (userId:string) => queryOptions({
  queryKey:['experiences',userId],
  queryFn:async () => {
    const rows:Experience[]=[];
    for(let from=0;;from+=1000) {
      const {data,error}=await supabase.from('visit_experiences').select('*').eq('user_id',userId).order('created_at').order('id').range(from,from+999);
      if(error) throw error; rows.push(...(data ?? [])); if(!data || data.length<1000) return rows;
    }
  }
});
export function refreshExperiences(qc:QueryClient,userId:string) {
  for(const key of ['experiences','visits','media','badges']) void qc.invalidateQueries({queryKey:[key,userId]});
}
export const experiencePreviewsQuery = (userId:string, ids:string[]) => queryOptions({
  queryKey:['media',userId,'experiences', [...ids].sort()], staleTime:1000*60*45,refetchInterval:1000*60*45,
  queryFn:async()=>{
    if(!ids.length) return [];
    const rows:VisitMedia[]=[];
    for(let from=0;;from+=1000) {
      const {data,error}=await supabase.from('visit_media').select('*').eq('user_id',userId).in('experience_id',ids).order('created_at').order('id').range(from,from+999);
      if(error) throw error; rows.push(...(data ?? [])); if(!data || data.length<1000) break;
    }
    const photos=new Map<string,VisitMedia>();
    for(const row of rows) if(row.experience_id && row.media_type==='photo' && !photos.has(row.experience_id)) photos.set(row.experience_id,row);
    const selected=[...photos.values()];
    const signed=selected.length ? await supabase.storage.from('visit-media').createSignedUrls(selected.map(p=>p.storage_path),3600) : null;
    if(signed?.error) throw signed.error;
    return ids.map(id=>{const photo=photos.get(id); const index=photo ? selected.indexOf(photo) : -1; return {id,photos:rows.filter(r=>r.experience_id===id && r.media_type==='photo').length,videos:rows.filter(r=>r.experience_id===id && r.media_type==='video').length,photo:photo ? {...photo,url:signed?.data?.[index]?.signedUrl ?? ''} : undefined};});
  }
});
export async function removeExperience(userId:string,experienceId:string) {
  const mark=await supabase.from('visit_experiences').update({deleting:true}).eq('id',experienceId).eq('user_id',userId).select('id').single();
  if(mark.error) throw mark.error;
  // Marking locks the experience against concurrent media inserts. Delete in batches;
  // retain the marked experience if either storage or database cleanup fails.
  for(;;) {
    const {data,error}=await supabase.from('visit_media').select('*').eq('user_id',userId).eq('experience_id',experienceId).order('id').limit(100);
    if(error) throw error; if(!data?.length) break;
    const storage=await supabase.storage.from('visit-media').remove(data.map(r=>r.storage_path));
    if(storage.error) throw storage.error;
    const removed=await supabase.from('visit_media').delete().eq('user_id',userId).eq('experience_id',experienceId).in('id',data.map(r=>r.id));
    if(removed.error) throw removed.error;
  }
  const removed=await supabase.from('visit_experiences').delete().eq('id',experienceId).eq('user_id',userId);
  if(removed.error) throw removed.error;
}
