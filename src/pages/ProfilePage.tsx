import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Mail, Settings, Shield, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authAPI } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CurrentUser = {
  id?: number | string;
  username?: string;
  role?: string;
  email?: string;
  profilePicture?: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<CurrentUser>(JSON.parse(localStorage.getItem("user") || "{}"));
  const initials = (user?.username || "U").slice(0, 2).toUpperCase();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const cached = JSON.parse(localStorage.getItem("user") || "{}");
        const me = await authAPI.me();
        const merged = { ...me, profilePicture: cached.profilePicture || me.profilePicture };
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
      } catch {
        // Use cached local user data.
      }
    };
    loadUser();
  }, []);

  const persistUser = (nextUser: CurrentUser) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const handleProfileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      persistUser({ ...user, profilePicture: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    const next = { ...user };
    delete next.profilePicture;
    persistUser(next);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage account details, profile picture, and preferences</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={user.profilePicture || ""} alt={user.username || "User"} />
                <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h2 className="text-xl font-semibold">{user.username || "User"}</h2>
                <p className="text-sm text-muted-foreground capitalize">{user.role || "Member"}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" /> {user.profilePicture ? "Change Photo" : "Upload Photo"}
              </Button>
              {user.profilePicture ? (
                <Button variant="ghost" className="text-destructive" onClick={handleRemovePicture}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4" /> Username</div>
              <p className="text-sm text-muted-foreground">{user.username || "N/A"}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4" /> Role</div>
              <p className="text-sm text-muted-foreground capitalize">{user.role || "N/A"}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4" /> Email</div>
              <p className="text-sm text-muted-foreground">{user.email || "N/A"}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">ID</div>
              <p className="text-sm text-muted-foreground">{user.id || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" /> Manage Settings
        </Button>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}
