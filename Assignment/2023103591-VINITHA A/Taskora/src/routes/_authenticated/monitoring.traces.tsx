import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/monitoring/traces")({head:()=>({meta:[{title:"Traces — Taskora"},{name:"description",content:"Taskora traces workspace."},{property:"og:title",content:"Traces — Taskora"},{property:"og:description",content:"Taskora traces workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="traces"/>});
