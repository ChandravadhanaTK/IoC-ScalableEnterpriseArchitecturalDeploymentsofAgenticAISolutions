import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route = createFileRoute("/_authenticated/planner")({head:()=>({meta:[{title:"Planner — Taskora"},{name:"description",content:"Taskora planner workspace."},{property:"og:title",content:"Planner — Taskora"},{property:"og:description",content:"Taskora planner workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="planner"/>});
