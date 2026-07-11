"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionInputProps {
  onSubmit: (description: string) => void;
}

export function DescriptionInput({ onSubmit }: DescriptionInputProps) {
  const [value, setValue] = useState("");

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        placeholder="Describe the issue (e.g. large pothole near bus stop, causing traffic slowdown)..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="text-sm resize-none"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSubmit(value)} className="flex-1">
          Submit Complaint
        </Button>
        <Button size="sm" variant="outline" onClick={() => onSubmit("")}>
          Skip
        </Button>
      </div>
    </div>
  );
}
