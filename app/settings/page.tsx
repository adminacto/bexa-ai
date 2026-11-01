"use client";
/**
 * BEXA AI — Settings page
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { Settings, Save, Lock, Shield, Globe, Bell, Database, Users } from "lucide-react";
import { toast } from "sonner";

type Setting = {
  key: string;
  value: string;
  type: string;
  description: string | null;
  is_public: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      const settingsMap: Record<string, string> = {};
      data.settings.forEach((s: Setting) => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400">Application configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              <a href="#general" className="flex items-center gap-2 p-2 text-sm rounded-lg hover:bg-card-hover text-gray-300">
                <Globe className="h-4 w-4" /> General
              </a>
              <a href="#security" className="flex items-center gap-2 p-2 text-sm rounded-lg hover:bg-card-hover text-gray-300">
                <Shield className="h-4 w-4" /> Security
              </a>
              <a href="#billing" className="flex items-center gap-2 p-2 text-sm rounded-lg hover:bg-card-hover text-gray-300">
                <Database className="h-4 w-4" /> Database
              </a>
            </nav>
          </CardContent>
        </Card>

        {/* Settings panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card id="general">
            <CardHeader>
              <CardTitle className="text-white">General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Application Name
                </label>
                <Input
                  value={settings.app_name || "BEXA AI"}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Site URL
                </label>
                <Input
                  value={settings.app_url || "https://bexa-ai.vercel.app"}
                  onChange={(e) => setSettings({ ...settings, app_url: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Default Currency
                </label>
                <Select
                  value={settings.default_currency || "USD"}
                  onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="UZS">UZS - Uzbek Sum</option>
                  <option value="RUB">RUB - Russian Ruble</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card id="security">
            <CardHeader>
                  <CardTitle className="text-white">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Require Password Change on First Login
                    </label>
                    <Select
                      value={settings.require_password_change_on_first_login || "true"}
                      onChange={(e) =>
                        setSettings({ ...settings, require_password_change_on_first_login: e.target.value })
                      }
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Force new users to change their password after initial setup.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <Input
                      type="number"
                      value={settings.session_timeout || "1440"}
                      onChange={(e) =>
                        setSettings({ ...settings, session_timeout: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
