import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/taskora/workspace";
export const Route=createFileRoute("/_authenticated/")({head:()=>({meta:[{title:"Dashboard — Taskora"},{name:"description",content:"Your private Taskora student productivity dashboard."},{property:"og:title",content:"Dashboard — Taskora"},{property:"og:description",content:"Your private Taskora student productivity dashboard."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:()=> <Workspace page="dashboard"/>});
