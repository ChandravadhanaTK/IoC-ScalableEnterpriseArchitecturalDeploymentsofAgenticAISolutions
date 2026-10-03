import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/monitoring")({head:()=>({meta:[{title:"Monitoring — Taskora"},{name:"description",content:"Taskora monitoring workspace."},{property:"og:title",content:"Monitoring — Taskora"},{property:"og:description",content:"Taskora monitoring workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="monitoring"/>});
