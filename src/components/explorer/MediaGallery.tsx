import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { mediaQuery } from "@/lib/queries";
import { mediaContentType, validateMedia } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Item = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaQuery>["queryFn"]>>>[number];

export function MediaGallery({ userId, istat }: { userId: string; istat: string }) {
  const qc = useQueryClient();
  const q = useQuery(mediaQuery(userId, istat));
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [caption, setCaption] = useState("");
  const [deleting, setDeleting] = useState<Item | null>(null);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["media", userId] });
    qc.invalidateQueries({ queryKey: ["badges", userId] });
  };

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const check = validateMedia(file);
      if (!check.ok) { toast.error(check.error); continue; }
      setUploading((u) => [...u, file.name]);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${userId}/${istat}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("visit-media").upload(path, file, { contentType: mediaContentType(file) });
        if (up.error) throw up.error;
        const ins = await supabase.from("visit_media").insert({
          user_id: userId, istat_code: istat, file_name: file.name, media_type: check.kind, storage_path: path,
        });
        if (ins.error) {
          await supabase.storage.from("visit-media").remove([path]);
          throw ins.error;
        }
        toast.success(`${check.kind === "photo" ? "Foto" : "Video"} caricato`);
      } catch (e) {
        toast.error(`Caricamento di "${file.name}" non riuscito: ${(e as Error).message}`);
      } finally {
        setUploading((u) => u.filter((n) => n !== file.name));
      }
    }
    if (input.current) input.current.value = "";
    refresh();
  }

  async function saveCaption() {
    if (!editing) return;
    const { error } = await supabase.from("visit_media").update({ caption: caption.trim() || null }).eq("id", editing.id);
    if (error) toast.error("Impossibile salvare la didascalia");
    else { toast.success("Didascalia aggiornata"); refresh(); }
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const st = await supabase.storage.from("visit-media").remove([deleting.storage_path]);
    if (st.error) { toast.error("Eliminazione del file non riuscita"); return; }
    const { error } = await supabase.from("visit_media").delete().eq("id", deleting.id);
    if (error) toast.error("Eliminazione non riuscita");
    else toast.success("Elemento eliminato");
    setDeleting(null);
    refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Galleria</h2>
          <p className="text-xs text-muted-foreground">Foto JPEG, PNG, WebP fino a 10 MB · Video MP4, MOV fino a 50 MB</p>
        </div>
        <Button variant="outline" onClick={() => input.current?.click()} disabled={uploading.length > 0}>
          {uploading.length ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Aggiungi
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.mov"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {q.isError && <p className="text-sm text-destructive">Impossibile caricare la galleria.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {uploading.map((n) => (
          <div key={n} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted p-2 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="line-clamp-2 break-all">{n}</span>
          </div>
        ))}
        {q.data?.map((m) => (
          <figure key={m.id} className="group relative overflow-hidden rounded-xl border bg-muted">
            <button type="button" className="block aspect-square w-full" onClick={() => setViewing(m)} aria-label={`Apri ${m.file_name}`}>
              {m.media_type === "photo" ? (
                <img src={m.url} alt={m.caption ?? m.file_name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="relative h-full w-full">
                  <video src={m.url} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/85"><Play className="h-4 w-4" /></span>
                  </span>
                </div>
              )}
            </button>
            {m.caption && <figcaption className="truncate px-2 py-1.5 text-xs">{m.caption}</figcaption>}
            <div className="absolute right-1.5 top-1.5 flex gap-1">
              <Button size="icon" variant="secondary" className="h-7 w-7" aria-label="Modifica didascalia"
                onClick={() => { setEditing(m); setCaption(m.caption ?? ""); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7" aria-label="Elimina" onClick={() => setDeleting(m)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </figure>
        ))}
      </div>
      {q.data && q.data.length === 0 && uploading.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nessun ricordo ancora. Aggiungi foto o brevi video di questo viaggio.
        </p>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only"><DialogTitle>{viewing?.file_name}</DialogTitle></DialogHeader>
          {viewing?.media_type === "photo" ? (
            <img src={viewing.url} alt={viewing.caption ?? viewing.file_name} className="max-h-[80vh] w-full rounded-lg object-contain" />
          ) : viewing ? (
            <video src={viewing.url} controls autoPlay playsInline className="max-h-[80vh] w-full rounded-lg" />
          ) : null}
          {viewing?.caption && <p className="px-2 pb-2 text-sm">{viewing.caption}</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifica didascalia</DialogTitle></DialogHeader>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Una breve descrizione" maxLength={200} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annulla</Button>
            <Button onClick={saveCaption}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo elemento?</AlertDialogTitle>
            <AlertDialogDescription>Il file verrà eliminato definitivamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
