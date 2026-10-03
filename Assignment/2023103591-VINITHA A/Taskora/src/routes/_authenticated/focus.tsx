import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/focus")({head:()=>({meta:[{title:"Focus — Taskora"},{name:"description",content:"Taskora focus workspace."},{property:"og:title",content:"Focus — Taskora"},{property:"og:description",content:"Taskora focus workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="focus"/>});
