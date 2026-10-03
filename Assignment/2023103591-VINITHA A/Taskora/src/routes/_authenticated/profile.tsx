import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/profile")({head:()=>({meta:[{title:"Profile — Taskora"},{name:"description",content:"Taskora profile workspace."},{property:"og:title",content:"Profile — Taskora"},{property:"og:description",content:"Taskora profile workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="profile"/>});
