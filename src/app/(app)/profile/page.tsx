"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Calendar, Shield, Camera, Save, Eye, EyeOff, ArrowLeft, X, Link2, Palette, Upload, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";

// Generate avatar options using DiceBear API
const AVATAR_STYLES = ["adventurer", "avataaars", "bottts", "fun-emoji", "lorelei", "micah", "miniavs", "pixel-art", "thumbs"];
function generateAvatarOptions(seed: string): string[] {
  return AVATAR_STYLES.map(
    (style) => `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
  );
}

const GRADIENT_AVATARS = [
  "from-blue-500 to-purple-600",
  "from-green-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
  "from-yellow-500 to-orange-500",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Avatar state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"generated" | "upload" | "url">("generated");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setName(data.user.name);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setSaveMessage("Profile updated successfully!");
        // Update session so header reflects new name
        await updateSession({ name: data.user.name });
      } else {
        const err = await res.json();
        setSaveMessage(err.error || "Failed to update profile");
      }
    } catch {
      setSaveMessage("Failed to update profile");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        setPasswordMessage(err.error || "Failed to change password");
      }
    } catch {
      setPasswordMessage("Failed to change password");
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordMessage(""), 5000);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Use JPG, PNG, GIF, WebP, or SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 2MB.");
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setAvatarSaving(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setShowAvatarPicker(false);
        setUploadFile(null);
        setUploadPreview(null);
        await updateSession({ image: data.user.avatar });
      } else {
        const err = await res.json();
        setUploadError(err.error || "Upload failed");
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function saveAvatar(avatarUrl: string | null) {
    setAvatarSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: avatarUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setShowAvatarPicker(false);
        await updateSession({ image: data.user.avatar });
      }
    } catch {
      // silent
    } finally {
      setAvatarSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--accent-primary)", boxShadow: "0 0 16px rgba(124,92,252,0.3)" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Failed to load profile
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-floatIn">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[var(--overlay-subtle)] hover:bg-[var(--overlay-medium)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Profile Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>Manage your account information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card glass-glow p-7 animate-floatIn stagger-1">
        <div className="flex items-center gap-6 mb-7">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: "2px solid var(--border-default)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)", boxShadow: "0 4px 24px rgba(124,92,252,0.3)" }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full text-white transition-all duration-200 hover:scale-110"
              style={{ background: "var(--accent-primary)", boxShadow: "0 2px 8px rgba(124,92,252,0.4)" }}
              title="Change avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{profile.name}</h2>
            <div className="flex items-center gap-2 text-sm mt-1.5" style={{ color: "var(--text-tertiary)" }}>
              <Mail className="w-4 h-4" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              <Shield className="w-4 h-4" />
              <span className="capitalize">{profile.provider} account</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Edit Name */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
              Display Name
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder="Your name"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving || name.trim() === profile.name}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {saveMessage && (
            <p
              className={`text-sm ${
                saveMessage.includes("success")
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </form>
      </div>

      {/* Change Password */}
      {profile.provider === "credentials" && (
        <div className="glass-card glass-glow p-7 animate-floatIn stagger-2">
          <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-5">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="Enter new password (min 8 chars)"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className="btn btn-primary w-full"
            >
              {passwordSaving ? "Changing..." : "Change Password"}
            </button>

            {passwordMessage && (
              <p
                className={`text-sm ${
                  passwordMessage.includes("success")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {passwordMessage}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card glass-glow p-7 animate-floatIn stagger-3">
        <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-5">Account Information</h3>
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>User ID</span>
            <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{profile.id}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Email</span>
            <span style={{ color: "var(--text-secondary)" }}>{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Auth Provider</span>
            <span className="capitalize" style={{ color: "var(--text-secondary)" }}>{profile.provider}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Member Since</span>
            <span style={{ color: "var(--text-secondary)" }}>
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4" style={{ background: 'var(--backdrop-bg)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowAvatarPicker(false); }}>
          <div className="animate-scaleIn border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-xl)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Choose Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="p-1.5 rounded-xl hover:bg-[var(--overlay-medium)] transition-colors" style={{ color: "var(--text-tertiary)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 px-6 pt-4">
              <button
                onClick={() => setAvatarTab("generated")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  avatarTab === "generated" ? "text-white" : "bg-[var(--overlay-subtle)] hover:bg-[var(--overlay-medium)]"
                }`}
                style={avatarTab === "generated" ? { background: "var(--accent-primary)", boxShadow: "0 2px 12px rgba(124,92,252,0.3)" } : { color: "var(--text-tertiary)" }}
              >
                <Palette className="w-4 h-4" />
                Generated
              </button>
              <button
                onClick={() => setAvatarTab("upload")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  avatarTab === "upload" ? "text-white" : "bg-[var(--overlay-subtle)] hover:bg-[var(--overlay-medium)]"
                }`}
                style={avatarTab === "upload" ? { background: "var(--accent-primary)", boxShadow: "0 2px 12px rgba(124,92,252,0.3)" } : { color: "var(--text-tertiary)" }}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setAvatarTab("url")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  avatarTab === "url" ? "text-white" : "bg-[var(--overlay-subtle)] hover:bg-[var(--overlay-medium)]"
                }`}
                style={avatarTab === "url" ? { background: "var(--accent-primary)", boxShadow: "0 2px 12px rgba(124,92,252,0.3)" } : { color: "var(--text-tertiary)" }}
              >
                <Link2 className="w-4 h-4" />
                Custom URL
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {avatarTab === "generated" && (
                <div className="space-y-4">
                  {/* DiceBear avatars */}
                  <div>
                    <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Pick a style — these are generated from your name</p>
                    <div className="grid grid-cols-3 gap-3">
                      {generateAvatarOptions(profile.name).map((url, i) => (
                        <button
                          key={i}
                          onClick={() => saveAvatar(url)}
                          disabled={avatarSaving}
                          className={`relative p-2 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                            profile.avatar === url ? "bg-[var(--accent-primary)]/10" : "border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--overlay-subtle)]"
                          } disabled:opacity-50`}
                          style={profile.avatar === url ? { borderColor: "var(--accent-primary)", boxShadow: "0 0 12px rgba(124,92,252,0.2)" } : {}}
                        >
                          <img src={url} alt={AVATAR_STYLES[i]} className="w-full aspect-square rounded-lg" />
                          <span className="block text-xs text-gray-400 mt-1 text-center capitalize">{AVATAR_STYLES[i].replace("-", " ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Initials with different gradients */}
                  <div>
                    <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Or use your initials with a color</p>
                    <div className="flex gap-2 flex-wrap">
                      {GRADIENT_AVATARS.map((gradient, i) => (
                        <button
                          key={i}
                          onClick={() => saveAvatar(null)}
                          disabled={avatarSaving}
                          className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg font-bold transition-all duration-200 hover:scale-110 ring-2 ${
                            !profile.avatar && i === 0 ? "ring-[var(--accent-primary)]" : "ring-transparent hover:ring-[var(--overlay-heavy)]"
                          } disabled:opacity-50`}
                        >
                          {initials}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {avatarTab === "upload" && (
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Upload an image from your device (JPG, PNG, GIF, WebP, SVG — max 2MB)</p>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!uploadPreview ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-[var(--border-default)] rounded-xl hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/5 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-full bg-[var(--overlay-subtle)] group-hover:bg-[var(--accent-primary)]/10 flex items-center justify-center transition-colors duration-200">
                        <ImagePlus className="w-7 h-7 group-hover:text-[var(--accent-primary-hover)] transition-colors duration-200" style={{ color: "var(--text-tertiary)" }} />
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Click to choose a file</span>
                        <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-[var(--overlay-subtle)] rounded-xl">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-default)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{uploadFile?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setUploadFile(null);
                            setUploadPreview(null);
                            setUploadError("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-2 rounded-lg hover:bg-[var(--overlay-medium)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-ghost flex-1 text-sm"
                        >
                          Choose different file
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={avatarSaving}
                          className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {avatarSaving ? "Uploading..." : "Upload & Apply"}
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-sm text-red-400">{uploadError}</p>
                  )}
                </div>
              )}

              {avatarTab === "url" && (
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Enter a URL to an image (e.g. Gravatar, GitHub avatar, etc.)</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="input flex-1 text-sm"
                    />
                    <button
                      onClick={() => saveAvatar(customAvatarUrl)}
                      disabled={!customAvatarUrl.trim() || avatarSaving}
                      className="btn btn-primary text-sm"
                    >
                      {avatarSaving ? "Saving..." : "Apply"}
                    </button>
                  </div>
                  {customAvatarUrl && (
                    <div className="flex items-center gap-4 p-3 bg-[var(--overlay-subtle)] rounded-xl">
                      <img
                        src={customAvatarUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-default)]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="text-sm text-gray-400">Preview</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {profile.avatar && (
              <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border-default)" }}>
                <button
                  onClick={() => saveAvatar(null)}
                  disabled={avatarSaving}
                  className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  Remove avatar (use initials)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
