import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/architecture/workflows")({head:()=>({meta:[{title:"Workflows — Taskora"},{name:"description",content:"Taskora workflows workspace."},{property:"og:title",content:"Workflows — Taskora"},{property:"og:description",content:"Taskora workflows workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="workflows"/>});
