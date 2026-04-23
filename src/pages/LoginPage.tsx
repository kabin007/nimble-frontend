import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { authAPI } from "@/lib/api";
import api from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { access_token, user } = await authAPI.login(username, password);
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      navigate("/", { replace: true });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A4B8C] p-4">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden">
        {/* Two-tone accent bar */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#1A4B8C]" />
          <div className="flex-1 bg-[#E8680A]" />
        </div>

        <CardHeader className="flex flex-col items-center space-y-2 pt-8 pb-4">
          <div className="w-12 h-12 rounded-lg bg-[#E8680A] flex items-center justify-center mb-1">
            <Lock className="text-white w-6 h-6" />
          </div>
          <CardTitle className="text-[22px] font-medium text-center text-gray-900">
            Nimble Garment Management System
          </CardTitle>
          <CardDescription className="text-center text-gray-500 text-sm">
            Login
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-600">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                className="border-gray-200 focus:border-[#1A4B8C] focus:ring-[#1A4B8C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-600">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="border-gray-200 focus:border-[#1A4B8C] focus:ring-[#1A4B8C]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E8680A] hover:bg-[#CF5A08] text-white font-medium py-2 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 pt-1">
              Having trouble?{" "}
              <a href="#" className="text-[#1A4B8C] font-medium hover:underline">
                Contact support
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}