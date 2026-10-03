import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/architecture")({head:()=>({meta:[{title:"Architecture — Taskora"},{name:"description",content:"Taskora architecture workspace."},{property:"og:title",content:"Architecture — Taskora"},{property:"og:description",content:"Taskora architecture workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="architecture"/>});
