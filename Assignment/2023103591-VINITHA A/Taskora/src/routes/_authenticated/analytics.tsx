import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/analytics")({head:()=>({meta:[{title:"Analytics — Taskora"},{name:"description",content:"Taskora analytics workspace."},{property:"og:title",content:"Analytics — Taskora"},{property:"og:description",content:"Taskora analytics workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="analytics"/>});
