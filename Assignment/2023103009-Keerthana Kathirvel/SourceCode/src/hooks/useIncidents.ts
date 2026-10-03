import { useQuery } from "@tanstack/react-query";
import { incidentService } from "@/services/incidentService";

export const useIncidents = () => useQuery({ queryKey: ["incidents"], queryFn: incidentService.list });
export const useIncident = (id: string) => useQuery({ queryKey: ["incident", id], queryFn: () => incidentService.get(id) });
export const useAudit = () => useQuery({ queryKey: ["audit"], queryFn: incidentService.listAudit });
