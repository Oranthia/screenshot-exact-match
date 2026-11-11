import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { PersonalPage } from "@/components/explorer/PersonalPage";

export const Route = createFileRoute("/_authenticated/badge")({
  head: () => ({ meta: [
    { title: "I miei badge — Italia Explorer" }, { name: "description", content: "Le future conquiste dei tuoi viaggi in Italia." },
    { property: "og:title", content: "I miei badge — Italia Explorer" }, { property: "og:description", content: "Nuove conquiste in arrivo per il tuo passaporto di viaggio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: BadgesPage,
});
function BadgesPage() {
  return <PersonalPage>{() => <div><p className="text-xs uppercase tracking-widest text-gold-foreground">Il tuo percorso</p><h1 className="mt-1 text-4xl font-semibold">I miei badge</h1>
    <section className="flex flex-col items-center gap-5 py-16 text-center"><div className="flex h-28 w-28 items-center justify-center rounded-full border border-gold bg-secondary"><Award className="h-16 w-16 text-gold-foreground" strokeWidth={1.15} /></div><h2 className="text-3xl font-semibold">Nuove conquiste in arrivo</h2><p className="max-w-md text-muted-foreground">Ogni viaggio sarà un passo verso nuove conquiste, tra città scoperte e regioni esplorate.</p></section>
  </div>}</PersonalPage>;
}