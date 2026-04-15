import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, User, Bell, Lock, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authAPI } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CurrentUser = {
  id?: number | string;
  username?: string;
  role?: string;
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState<CurrentUser>(JSON.parse(localStorage.getItem("user") || "{}"));

  useEffect(() => {
    const loadMe = async () => {
      try {
        const me = await authAPI.me();
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } catch {
        // Keep last cached user if token is missing/expired.
      }
    };
    loadMe();
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Account Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>View and manage your account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                  <p className="mt-1 text-gray-900 dark:text-white font-semibold">{user.username || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <p className="mt-1 text-gray-900 dark:text-white font-semibold capitalize">
                    {user.role || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                  <p className="mt-1 text-gray-900 dark:text-white font-semibold">{user.id || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Preferences Section */}
        <Card className="mb-6 mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                </div>
                <Button variant="outline" disabled size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Data Export</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download your account data</p>
                </div>
                <Button variant="outline" disabled size="sm">
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Security Section */}
        <Card className="mb-6 mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" fullWidth disabled>
                Change Password
              </Button>
              <Button variant="outline" fullWidth disabled>
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" fullWidth disabled>
                View Active Sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Appearance Section */}
        <Card className="mb-6 mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toggle dark theme</p>
                </div>
                <Button variant="outline" disabled size="sm">
                  Not Available
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Logout Section */}
        <Card className="border-red-200 dark:border-red-900 mt-6">
          <CardHeader className="bg-red-50 dark:bg-red-950 rounded-t-lg">
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <CardTitle className="text-red-600 dark:text-red-400">Logout</CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You will be signed out from this account and redirected to the login page.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
