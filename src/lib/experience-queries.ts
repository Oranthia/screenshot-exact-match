import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { fetchExperiencePreviews, fetchExperiences } from '@/data/backend';
import { MEDIA_REFRESH_MS } from '@/data/contracts';
export { removeExperience } from '@/data/backend';
export const experiencesQuery = (userId:string) => queryOptions({
  queryKey:['experiences',userId],
  queryFn:() => fetchExperiences(userId),
});
export function refreshExperiences(qc:QueryClient,userId:string) {
  for(const key of ['experiences','visits','media','badges']) void qc.invalidateQueries({queryKey:[key,userId]});
}
export const experiencePreviewsQuery = (userId:string, ids:string[]) => queryOptions({
  queryKey:['media',userId,'experiences', [...ids].sort()], staleTime:MEDIA_REFRESH_MS,refetchInterval:MEDIA_REFRESH_MS,
  queryFn:() => fetchExperiencePreviews(userId, ids),
});
