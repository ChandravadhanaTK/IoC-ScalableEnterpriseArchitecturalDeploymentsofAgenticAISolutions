import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { addInvoice, buildInvoice, type Invoice } from "@/lib/store";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit Claim — AuditLens" },
      { name: "description", content: "Submit a new invoice or expense claim for AI audit." },
      { property: "og:title", content: "Submit Claim — AuditLens" },
      { property: "og:description", content: "Submit a new invoice or expense claim for AI audit." },
    ],
  }),
  component: Submit,
});

const CATS: Invoice["category"][] = ["Travel", "Meals", "Software", "Hardware", "Consulting", "Office"];

function Submit() {
  const nav = useNavigate();
  const [f, setF] = useState({ vendor: "", vendorGstin: "", employee: "", department: "", category: "Meals" as Invoice["category"], date: new Date().toISOString().slice(0, 10), invoiceNo: "", desc: "", qty: 1, unit: 0, tax: 0, hasReceipt: true, notes: "" });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = "INV-" + Math.floor(2000 + Math.random() * 7999);
    addInvoice(buildInvoice({ id, vendor: f.vendor, vendorGstin: f.vendorGstin, employee: f.employee, department: f.department, category: f.category, date: f.date, invoiceNo: f.invoiceNo, items: [{ desc: f.desc, qty: Number(f.qty), unit: Number(f.unit) }], tax: Number(f.tax), hasReceipt: f.hasReceipt, notes: f.notes }));
    nav({ to: "/invoices/$id", params: { id } });
  };
  const input = (k: keyof typeof f, label: string, type = "text") => (
    <label><span className="label">{label}</span><input required={!["vendorGstin", "notes"].includes(k)} type={type} className="field" value={String(f[k])} onChange={(e) => set(k, e.target.value)} /></label>
  );
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Submit a claim</h1>
      <p className="mt-2 text-muted-foreground">The Intake agent captures the claim; then open it to run the audit pipeline.</p>
      <form onSubmit={submit} className="panel mt-8 grid gap-4 md:grid-cols-2">
        {input("vendor", "Vendor")}
        {input("vendorGstin", "Vendor GSTIN")}
        {input("employee", "Employee")}
        {input("department", "Department")}
        <label><span className="label">Category</span><select className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        {input("date", "Expense date", "date")}
        {input("invoiceNo", "Invoice number")}
        {input("desc", "Line item description")}
        {input("qty", "Quantity", "number")}
        {input("unit", "Unit price (INR)", "number")}
        {input("tax", "Tax (INR)", "number")}
        <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={f.hasReceipt} onChange={(e) => set("hasReceipt", e.target.checked)} /> Receipt attached</label>
        <label className="md:col-span-2"><span className="label">Justification notes</span><textarea className="field" rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
        <div className="md:col-span-2"><button className="btn-primary">Submit for audit</button></div>
      </form>
    </div>
  );
}
