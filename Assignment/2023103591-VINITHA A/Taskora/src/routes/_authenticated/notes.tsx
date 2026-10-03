import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/notes")({head:()=>({meta:[{title:"Notes — Taskora"},{name:"description",content:"Taskora notes workspace."},{property:"og:title",content:"Notes — Taskora"},{property:"og:description",content:"Taskora notes workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="notes"/>});
