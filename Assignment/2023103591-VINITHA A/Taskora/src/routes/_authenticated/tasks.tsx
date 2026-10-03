import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/tasks")({head:()=>({meta:[{title:"Tasks — Taskora"},{name:"description",content:"Taskora tasks workspace."},{property:"og:title",content:"Tasks — Taskora"},{property:"og:description",content:"Taskora tasks workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="tasks"/>});
