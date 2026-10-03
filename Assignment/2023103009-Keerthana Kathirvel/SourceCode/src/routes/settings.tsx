import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CampusFlow AI" },
      { name: "description", content: "Manage your profile, notifications, security and application preferences." },
      { property: "og:title", content: "Settings — CampusFlow AI" },
      { property: "og:description", content: "Profile and preferences for CampusFlow AI." },
    ],
  }),
  component: SettingsPage,
});

function Row({ title, desc, defaultChecked }: { title: string; desc: string; defaultChecked?: boolean | undefined }) {
  return <div className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div><Switch defaultChecked={defaultChecked ?? false} /></div>;
}

function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user.name);
  const save = () => { if (name.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; } toast.success("Settings saved"); };

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and how CampusFlow AI works for you" />
      <Tabs defaultValue="profile">
        <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="prefs">Preferences</TabsTrigger></TabsList>
        <TabsContent value="profile"><Panel className="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
            <div><Label>Email</Label><Input value={user.email} disabled /></div>
            <div><Label>Role</Label><Input value={user.role} disabled /></div>
            <div><Label>Department</Label><Input defaultValue="Campus Operations" /></div>
          </div>
          <Button className="mt-5" onClick={save}>Save profile</Button>
        </Panel></TabsContent>
        <TabsContent value="notifications"><Panel className="max-w-2xl"><div className="divide-y">
          <Row title="Critical incident alerts" desc="Push and SMS for Critical priority" defaultChecked />
          <Row title="Approval requests" desc="Email when the agent needs your approval" defaultChecked />
          <Row title="Status updates on my reports" desc="Notify when incidents I reported change status" defaultChecked />
          <Row title="Daily operations digest" desc="Summary email at 8:00 AM" />
        </div><Button className="mt-4" onClick={save}>Save notifications</Button></Panel></TabsContent>
        <TabsContent value="security"><Panel className="max-w-2xl"><div className="divide-y">
          <Row title="Multi-factor authentication" desc="Require a second factor at sign in" defaultChecked={user.mfa} />
          <Row title="Sign-in alerts" desc="Email on sign-in from a new device" defaultChecked />
          <div className="flex items-center justify-between py-3"><div><p className="text-sm font-medium">Sign out of all other sessions</p><p className="text-xs text-muted-foreground">Ends every session except this one</p></div>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm">Sign out others</Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle><AlertDialogDescription>You'll stay signed in here. Other devices will need to sign in again.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => toast.success("Other sessions signed out")}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
        </div></Panel></TabsContent>
        <TabsContent value="prefs"><Panel className="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Time zone</Label><Select defaultValue="ist"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ist">Asia/Kolkata (IST)</SelectItem><SelectItem value="utc">UTC</SelectItem></SelectContent></Select></div>
            <div><Label>Default incident view</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All incidents</SelectItem><SelectItem value="mine">Assigned to me</SelectItem><SelectItem value="dept">My department</SelectItem></SelectContent></Select></div>
          </div>
          <div className="mt-2 divide-y"><Row title="Auto-approve low-risk AI routing" desc="Low/Medium priority with confidence ≥ 80%" defaultChecked /><Row title="Compact tables" desc="Denser rows in incident lists" /></div>
          <Button className="mt-4" onClick={save}>Save preferences</Button>
        </Panel></TabsContent>
      </Tabs>
    </>
  );
}
