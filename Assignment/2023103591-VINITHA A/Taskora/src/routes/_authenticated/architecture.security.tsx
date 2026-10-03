import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/architecture/security")({head:()=>({meta:[{title:"Security — Taskora"},{name:"description",content:"Taskora security workspace."},{property:"og:title",content:"Security — Taskora"},{property:"og:description",content:"Taskora security workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="security"/>});
