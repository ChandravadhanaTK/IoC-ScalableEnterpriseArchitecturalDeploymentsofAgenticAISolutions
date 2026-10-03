import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/architecture/deployment")({head:()=>({meta:[{title:"Deployment — Taskora"},{name:"description",content:"Taskora deployment workspace."},{property:"og:title",content:"Deployment — Taskora"},{property:"og:description",content:"Taskora deployment workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="deployment"/>});
