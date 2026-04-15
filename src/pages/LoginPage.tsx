import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

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
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username,
        password,
      });

      const { access_token, user } = response.data;

      // Store token and user data
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      // Redirect to dashboard
      navigate("/", { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-red-600 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-2 bg-gradient-to-r from-blue-50 to-red-50 rounded-t-lg">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            Garment Guru
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-blue-700 font-semibold">
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
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-700 font-semibold">
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
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-semibold py-2 rounded-lg transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-red-50 rounded-lg border border-blue-200">
            <p className="text-sm font-bold text-blue-900 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-blue-800">
              <p><span className="font-semibold text-red-600">Owner:</span> owner / owner123</p>
              <p><span className="font-semibold text-red-600">Manager:</span> manager / manager123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
