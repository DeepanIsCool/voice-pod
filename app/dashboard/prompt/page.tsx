"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RotateCcw, Save } from "lucide-react";

const MODEL_OPTIONS = [
  { value: "gemma2-9b-it", label: "Gemma2-9B-IT" },
  { value: "meta-llama/llama-guard-4-12b", label: "Llama Guard 4-12B" },
  { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B Instruct" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3-70B Versatile" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1-8B Instant" },
  { value: "llama3-70b-8192", label: "Llama3-70B-8192" },
  { value: "llama3-8b-8192", label: "Llama3-8B-8192" },
  { value: "whisper-large-v3", label: "Whisper Large v3" },
  { value: "whisper-large-v3-turbo", label: "Whisper Large v3 Turbo" },
  { value: "distil-whisper-large-v3-en", label: "Distil Whisper Large v3 EN" },
];

const STT_OPTIONS = [
  { value: "nova-3-general", label: "Nova 3" },
  { value: "nova-2-general", label: "Nova 2" },
];

const TTS_OPTIONS = [
  { value: "gpt-4o-mini-tts", label: "GPT-4o Mini TTS" },
  { value: "tts-1", label: "TTS-1" },
  { value: "tts-1-hd", label: "TTS-1 HD" },
];

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

const VAD_SAMPLE_RATE_OPTIONS = [
  { value: "8000", label: "8000 Hz" },
  { value: "16000", label: "16000 Hz" },
];

const INFO = {
  GROQ_MODEL:
    "Choose the model that will generate all content (the 'brain' of the agent).",
  GROQ_MAX_TOKENS:
    "Maximum tokens generated per response. Higher = longer replies.",
  GROQ_TEMPERATURE:
    "Controls randomness. 0 = deterministic, 5 = very creative.",
  SPEECH_RECOGNITION_MODEL: "Model for converting speech to text.",
  TTS_MODEL: "Text-to-Speech model for AI voice output.",
  TTS_VOICE: "AI voice to use for speaking.",
  VAD_SAMPLE_RATE: "Sample rate for voice activity detection.",
  VAD_SPEECH_FRAMES:
    "Frames needed to detect 'speech' (lower = faster trigger, higher = less sensitive).",
  VAD_SILENCE_FRAMES:
    "Frames needed to detect 'silence' (higher = longer pause needed to cut).",
  SYSTEM_PROMPT: "Instructions to guide the AI agent's behavior.",
  SYSTEM_MESSAGE: "Welcome message shown to users when interaction starts.",
};

type EnvConfig = {
  GROQ_MODEL: string;
  GROQ_MAX_TOKENS: string;
  GROQ_TEMPERATURE: string;
  TTS_MODEL: string;
  TTS_VOICE: string;
  SYSTEM_PROMPT: string;
  SYSTEM_MESSAGE: string;
  SPEECH_RECOGNITION_MODEL: string;
  VAD_SAMPLE_RATE: string;
  VAD_SPEECH_FRAMES: string;
  VAD_SILENCE_FRAMES: string;
};

export default function PromptManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { control, handleSubmit, setValue, watch, reset } = useForm<EnvConfig>({
    defaultValues: {
      GROQ_MODEL: "",
      GROQ_MAX_TOKENS: "100",
      GROQ_TEMPERATURE: "0.0",
      TTS_MODEL: "",
      TTS_VOICE: "",
      SYSTEM_PROMPT: "",
      SYSTEM_MESSAGE: "",
      SPEECH_RECOGNITION_MODEL: "",
      VAD_SAMPLE_RATE: "8000",
      VAD_SPEECH_FRAMES: "1",
      VAD_SILENCE_FRAMES: "2",
    },
  });

  // Load initial config
  useEffect(() => {
    setIsLoading(true);
    fetch("https://ai.rajatkhandelwal.com/env", {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        // Patch to handle possible missing SYSTEM_PROMPT
        reset({
          ...data,
          SYSTEM_PROMPT: data.SYSTEM_PROMPT || "",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to fetch agent configuration.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line
  }, []);

  // Save handler
  const onSubmit = async (values: EnvConfig) => {
    setIsSaving(true);
    try {
      const response = await fetch("https://ai.rajatkhandelwal.com/updateenv", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Save failed");
      toast({ title: "Saved!", description: "Agent configuration updated." });
    } catch {
      toast({
        title: "Error",
        description: "Could not save config.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  // Reset handler
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("https://ai.rajatkhandelwal.com/resetenv", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Reset failed");
      // Refetch
      const data = await response.json();
      toast({
        title: "Reset to Default",
        description:
          data.message ||
          "Config has been reset. Restart the app to apply changes.",
      });
      // Refetch config after reset
      setIsLoading(true);
      fetch("https://ai.rajatkhandelwal.com/env", {
        headers: getAuthHeaders(),
      })
        .then((r) => r.json())
        .then((data) => reset({ ...data }))
        .finally(() => setIsLoading(false));
    } catch {
      toast({
        title: "Error",
        description: "Could not reset config.",
        variant: "destructive",
      });
    }
    setIsResetting(false);
  };

  return (
    <TooltipProvider>
      <div className="w-full min-h-[90vh] flex justify-center items-start bg-muted/60 dark:bg-background py-12">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-6xl bg-card shadow-xl rounded-2xl px-4 sm:px-12 py-10 flex flex-col gap-5"
        >
          {/* Header Row */}
          <div className="flex flex-row items-center justify-between mb-2">
            <h1 className="text-3xl font-mono font-bold text-foreground">
              Agent Configuration
            </h1>
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 font-bold px-4 py-2"
              onClick={handleReset}
              disabled={isLoading || isSaving || isResetting}
            >
              <span className="text-xl">⚠️</span>
              <span className="font-mono">RESET ALL</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="w-full py-32 flex justify-center text-lg animate-pulse text-foreground">
              Loading configuration…
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 w-full">
              {/* LEFT PANEL */}
              <div className="flex flex-col gap-5 justify-between h-full">
                {/* Welcome Message */}
                <div
                  className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-4 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
                  style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
                  /*
                    - ring-1: always show a thin ring
                    - ring-primary/30: faded blue for light mode
                    - dark:ring-primary/40: slightly stronger in dark mode
                    - ring-inset: keeps the ring inside the border
                    - boxShadow fallback for browsers that don't support ring
                  */
                >
                  <label className="font-mono font-bold text-lg flex items-center gap-2 text-foreground">
                    Welcome Prompt
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{INFO.SYSTEM_MESSAGE}</span>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <Controller
                    name="SYSTEM_MESSAGE"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        className="resize-y min-h-[100px] bg-background border border-border text-foreground"
                        rows={3}
                        maxLength={512}
                        {...field}
                      />
                    )}
                  />
                </div>
                {/* System Prompt */}
                <div
                  className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-4 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
                  style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
                >
                  <label className="font-mono font-bold text-lg flex items-center gap-2 text-foreground">
                    System Prompt
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{INFO.SYSTEM_PROMPT}</span>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <Controller
                    name="SYSTEM_PROMPT"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        className="resize-y min-h-[490px] bg-background border border-border text-foreground"
                        rows={6}
                        maxLength={2048}
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="flex flex-col gap-5 justify-between h-full">
                {/* LLM SECTION */}
                <div
                  className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-6 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
                  style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
                >
                  <div className="font-mono text-lg font-bold flex items-center gap-2 text-foreground">
                    LLM
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{INFO.GROQ_MODEL}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-col gap-4">
                    {/* Model Dropdown */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono min-w-[110px] text-foreground">
                        Model
                      </span>
                      <Controller
                        name="GROQ_MODEL"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full max-w-xs bg-background border border-border text-foreground">
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                              {MODEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {/* Max Tokens Slider */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono min-w-[110px] flex items-center gap-1 text-foreground">
                        Max Tokens
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-1 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{INFO.GROQ_MAX_TOKENS}</span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <Controller
                        name="GROQ_MAX_TOKENS"
                        control={control}
                        render={({ field }) => (
                          <div className="flex-1 flex items-center gap-2">
                            <Slider
                              min={100}
                              max={5000}
                              step={1}
                              value={[Number(field.value) || 100]}
                              onValueChange={(val) =>
                                field.onChange(val[0].toString())
                              }
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              min={100}
                              max={5000}
                              className="w-20 bg-background border border-border text-foreground"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                        )}
                      />
                    </div>
                    {/* Temperature Slider */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono min-w-[110px] flex items-center gap-1 text-foreground">
                        Temperature
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 ml-1 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{INFO.GROQ_TEMPERATURE}</span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <Controller
                        name="GROQ_TEMPERATURE"
                        control={control}
                        render={({ field }) => (
                          <div className="flex-1 flex items-center gap-2">
                            <Slider
                              min={0.0}
                              max={5.0}
                              step={0.1}
                              value={[Number(field.value) || 0.0]}
                              onValueChange={(val) =>
                                field.onChange(val[0].toFixed(1))
                              }
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={5}
                              step={0.1}
                              className="w-16 bg-background border border-border text-foreground"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Speech/Voice */}
                <div
                  className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-6 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
                  style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
                >
                  <div className="flex flex-col gap-4">
                    {/* Speech to Text */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono min-w-[140px] flex items-center gap-1 text-foreground">
                        Speech to Text
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{INFO.SPEECH_RECOGNITION_MODEL}</span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <Controller
                        name="SPEECH_RECOGNITION_MODEL"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full max-w-xs bg-background border border-border text-foreground">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {STT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {/* Text to Speech */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono min-w-[140px] flex items-center gap-1 text-foreground">
                        Text to Speech
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{INFO.TTS_MODEL}</span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <Controller
                        name="TTS_MODEL"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full max-w-xs bg-background border border-border text-foreground">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {TTS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {/* Voice */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono min-w-[140px] flex items-center gap-1 text-foreground">
                        Voice
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{INFO.TTS_VOICE}</span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <Controller
                        name="TTS_VOICE"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full max-w-xs bg-background border border-border text-foreground">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {VOICE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* VAD Config */}
                <div
                  className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-6 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
                  style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
                >
                  <div className="font-mono text-lg font-bold flex items-center gap-2 text-foreground">
                    VAD Configuration
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Voice Activity Detection (controls AI response timing to
                        speech).
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Sample Rate */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono min-w-[140px] flex items-center gap-1 text-foreground">
                      Sample Rate
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 ml-1 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{INFO.VAD_SAMPLE_RATE}</span>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <Controller
                      name="VAD_SAMPLE_RATE"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-32 bg-background border border-border text-foreground">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {VAD_SAMPLE_RATE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  {/* Speech Frames */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono min-w-[140px] flex items-center gap-1 text-foreground">
                      Speech Frames
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 ml-1 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{INFO.VAD_SPEECH_FRAMES}</span>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <Controller
                      name="VAD_SPEECH_FRAMES"
                      control={control}
                      render={({ field }) => (
                        <div className="flex-1 flex items-center gap-2">
                          <Slider
                            min={0}
                            max={5}
                            step={1}
                            value={[Number(field.value) || 1]}
                            onValueChange={(val) =>
                              field.onChange(val[0].toString())
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min={0}
                            max={5}
                            className="w-12 bg-background border border-border text-foreground"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      )}
                    />
                  </div>
                  {/* Silence Frames */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono min-w-[140px] flex items-center gap-1 text-foreground">
                      Silence Frames
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 ml-1 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{INFO.VAD_SILENCE_FRAMES}</span>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <Controller
                      name="VAD_SILENCE_FRAMES"
                      control={control}
                      render={({ field }) => (
                        <div className="flex-1 flex items-center gap-2">
                          <Slider
                            min={0}
                            max={5}
                            step={1}
                            value={[Number(field.value) || 2]}
                            onValueChange={(val) =>
                              field.onChange(val[0].toString())
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min={0}
                            max={5}
                            className="w-12 bg-background border border-border text-foreground"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button - bottom right */}
          <div className="flex justify-end items-center gap-2 mt-8">
            <Button
              type="submit"
              className="px-6 py-2 text-lg font-bold"
              disabled={isSaving || isLoading || isResetting}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}
