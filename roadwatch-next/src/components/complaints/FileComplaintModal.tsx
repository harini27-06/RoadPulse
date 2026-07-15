"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Navigation, MapPin, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGPSLocation } from "@/services/location.service";
import { createComplaint } from "@/services/complaint.service";
import { Complaint } from "@/types";

const ISSUE_TYPES = ["Pothole", "Crack", "Waterlogging", "Debris", "Damaged Road", "Missing Manhole"];

interface Props {
  onClose: () => void;
  onCreated: (c: Complaint) => void;
}

export function FileComplaintModal({ onClose, onCreated }: Props) {
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGPS = async () => {
    setGpsLoading(true);
    setError(null);
    try {
      const loc = await getGPSLocation();
      setLat(String(loc.latitude));
      setLon(String(loc.longitude));
      if (loc.address) setAddress(loc.address);
    } catch {
      setError("Could not get GPS location.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setDetecting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { issue?: string; confidence?: number; image_url?: string; location?: { latitude: number; longitude: number; address?: string }; error?: string };
      if (res.ok) {
        if (data.issue && data.issue !== "Not a Road" && data.issue !== "Good Road") {
          setIssueType(data.issue);
        }
        if (data.location) {
          setLat(String(data.location.latitude));
          setLon(String(data.location.longitude));
          if (data.location.address) setAddress(data.location.address);
        }
        // store the saved image_url on the file object for submission
        if (data.image_url) {
          (file as File & { savedUrl?: string }).savedUrl = data.image_url;
        }
      }
    } catch { /* non-fatal */ } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (!issueType) return setError("Select an issue type.");
    if (isNaN(latitude) || isNaN(longitude)) return setError("Please provide a valid location.");
    setSubmitting(true);
    setError(null);
    try {
      const savedUrl = imageFile ? (imageFile as File & { savedUrl?: string }).savedUrl : undefined;
      const complaint = await createComplaint({
        issue_type: issueType,
        confidence: 100,
        image_url: savedUrl,
        latitude,
        longitude,
        address: address || undefined,
        description: description || undefined,
      });
      onCreated(complaint);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-md bg-background border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/10">
            <h2 className="font-black text-sm">File a Complaint</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Image upload */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Photo (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-blue-500/20 h-36">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  {detecting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Loader2 className="h-4 w-4 animate-spin" /> Detecting...
                    </div>
                  )}
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full h-24 rounded-xl border-2 border-dashed border-blue-500/25 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-blue-500/50 hover:text-foreground transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Upload road photo</span>
                </button>
              )}
            </div>

            {/* Issue type */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Issue Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ISSUE_TYPES.map((t) => (
                  <button key={t} onClick={() => setIssueType(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${issueType === t ? "bg-blue-600 text-white border-blue-600" : "bg-muted text-muted-foreground border-border hover:border-blue-500/40"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Location</label>
              <Button variant="outline" size="sm" onClick={handleGPS} disabled={gpsLoading} className="w-full mb-2 gap-2">
                {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                Use Current GPS Location
              </Button>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} className="text-xs" />
                <Input placeholder="Longitude" value={lon} onChange={(e) => setLon(e.target.value)} className="text-xs" />
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <Input placeholder="Address (auto-filled or type manually)" value={address} onChange={(e) => setAddress(e.target.value)} className="text-xs" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button onClick={handleSubmit} disabled={submitting || detecting} className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Submit Complaint
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
