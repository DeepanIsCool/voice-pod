"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { Info, Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const MODEL_OPTIONS = [
  {
    value: "qwen-qwq-32b",
    label: "Qwen-QWQ-32B",
    inputPrice: "$0.29",
    outputPrice: "$0.39",
  },
  {
    value: "qwen/qwen3-32b",
    label: "Qwen3-32B",
    inputPrice: "$0.29",
    outputPrice: "$0.59",
  },
  {
    value: "deepseek-r1-distill-llama-70b",
    label: "DeepSeek R1 Distill Llama 70B",
    inputPrice: "$0.75",
    outputPrice: "$0.99",
  },
  {
    value: "gemma2-9b-it",
    label: "Gemma2-9B-IT",
    inputPrice: "$0.2",
    outputPrice: "$0.2",
  },
  {
    value: "compound-beta",
    label: "Compound Beta",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "distil-whisper-large-v3-en",
    label: "Distil Whisper Large v3 EN",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "llama-3.1-8b-instant",
    label: "Llama 3.1-8B Instant",
    inputPrice: "$0.05",
    outputPrice: "$0.08",
  },
  {
    value: "llama-3.3-70b-versatile",
    label: "Llama 3.3-70B Versatile",
    inputPrice: "$0.59",
    outputPrice: "$0.79",
  },
  {
    value: "llama-guard-3-8b",
    label: "Llama Guard 3-8B",
    inputPrice: "$0.2",
    outputPrice: "$0.2",
  },
  {
    value: "llama3-70b-8192",
    label: "Llama3-70B-8192",
    inputPrice: "$0.59",
    outputPrice: "$0.79",
  },
  {
    value: "llama3-8b-8192",
    label: "Llama3-8B-8192",
    inputPrice: "$0.05",
    outputPrice: "$0.08",
  },
  {
    value: "meta-llama/llama-4-maverick-17b-128e-instruct",
    label: "Llama 4 Maverick 17B 128E Instruct",
    inputPrice: "$0.2",
    outputPrice: "$0.6",
  },
  {
    value: "meta-llama/llama-4-scout-17b-16e-instruct",
    label: "Llama 4 Scout 17B 16E Instruct",
    inputPrice: "$0.11",
    outputPrice: "$0.34",
  },
  {
    value: "meta-llama/llama-guard-4-12b",
    label: "Llama Guard 4-12B",
    inputPrice: "$0.2",
    outputPrice: "$0.2",
  },
  {
    value: "meta-llama/llama-prompt-guard-2-22m",
    label: "Llama Prompt Guard 2-22M",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "meta-llama/llama-prompt-guard-2-86m",
    label: "Llama Prompt Guard 2-86M",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "mistral-saba-24b",
    label: "Mistral Saba 24B",
    inputPrice: "$0.79",
    outputPrice: "$0.79",
  },
  {
    value: "whisper-large-v3",
    label: "Whisper Large v3",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "whisper-large-v3-turbo",
    label: "Whisper Large v3 Turbo",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "playai-tts-1",
    label: "PlayAI TTS-1",
    inputPrice: "--",
    outputPrice: "--",
  },
  {
    value: "playai-tts-arabic",
    label: "PlayAI TTS Arabic",
    inputPrice: "--",
    outputPrice: "--",
  },
];

const STT_OPTIONS = [
  { value: "nova-3-general", label: "Nova 3", inputPrice: "", outputPrice: "" },
  { value: "nova-2-general", label: "Nova 2", inputPrice: "", outputPrice: "" },
];

const TTS_OPTIONS = [
  {
    value: "gpt-4o-mini-tts",
    label: "GPT-4o Mini TTS",
    inputPrice: "$0.60",
    outputPrice: "$12.00",
  },
  { value: "tts-1", label: "TTS-1", inputPrice: "", outputPrice: "" },
  { value: "tts-1-hd", label: "TTS-1 HD", inputPrice: "", outputPrice: "" },
];

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy" },
  { value: "ash", label: "Ash" },
  { value: "ballad", label: "Ballad" },
  { value: "coral", label: "Coral" },
  { value: "sage", label: "Sage" },
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
      // Replace double quotes with single quotes in SYSTEM_PROMPT
      const updatedValues = {
        ...values,
        SYSTEM_PROMPT: values.SYSTEM_PROMPT.replace(/"/g, "'")
      };
      const response = await fetch("https://ai.rajatkhandelwal.com/updateenv", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(updatedValues),
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
    <div className="flex flex-col h-full min-h-[80vh] w-full px-2 sm:px-4 py-6 space-y-8">
      <div className="flex items-center justify-between mb-2 sm:mb-4 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Agent Configuration</h1>
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
                    {...field}
                    className="min-h-[100px] font-mono text-sm"
                    placeholder="Enter welcome message..."
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
                    {...field}
                    className="min-h-[550px] font-mono text-sm"
                    placeholder="Enter system prompt..."
                  />
                )}
              />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-8 justify-between h-full">
            {/* LLM SECTION */}
            <div
              className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-8 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
              style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
            >
              <div className="font-mono text-lg font-bold flex items-center gap-2 text-foreground mb-2">
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
              <div className="flex flex-col gap-6">
                {/* Model Dropdown - Strict left alignment */}
                <div className="flex items-center gap-4 w-full">
                  <span className="font-mono min-w-[110px] flex items-center gap-1 text-foreground">
                    Model
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{INFO.GROQ_MODEL}</span>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <div className="flex-1">
                    <Controller
                      name="GROQ_MODEL"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full bg-background border border-border text-foreground">
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent className="min-w-[300px]">
                            {MODEL_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center justify-between w-full">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-semibold hover:underline decoration-dotted cursor-help">
                                        {opt.label}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="flex flex-col gap-1 p-2">
                                        {opt.inputPrice !== "--" && (
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                              Input:
                                            </span>
                                            <span className="font-mono font-bold">
                                              {opt.inputPrice}
                                            </span>
                                          </div>
                                        )}
                                        {opt.outputPrice !== "--" && (
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">
                                              Output:
                                            </span>
                                            <span className="font-mono font-bold">
                                              {opt.outputPrice}
                                            </span>
                                          </div>
                                        )}
                                        {opt.inputPrice === "--" &&
                                          opt.outputPrice === "--" && (
                                            <span className="text-muted-foreground">
                                              Pricing information not
                                              available
                                            </span>
                                          )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                  {(opt.inputPrice !== "--" ||
                                    opt.outputPrice !== "--") && (
                                    <div className="flex gap-1 text-xs text-muted-foreground ml-2">
                                      {opt.inputPrice !== "--" && (
                                        <span className="font-mono">
                                          {opt.inputPrice}
                                        </span>
                                      )}
                                      {opt.outputPrice !== "--" && (
                                        <span className="font-mono">
                                          →{opt.outputPrice}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                {/* Max Tokens Slider */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1 flex items-center gap-2">
                    <Controller
                      name="GROQ_MAX_TOKENS"
                      control={control}
                      render={({ field }) => (
                        <>
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
                        </>
                      )}
                    />
                  </div>
                </div>
                {/* Temperature Slider */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1 flex items-center gap-2">
                    <Controller
                      name="GROQ_TEMPERATURE"
                      control={control}
                      render={({ field }) => (
                        <>
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
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Speech/Voice */}
            <div
              className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-8 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
              style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
            >
              <div className="flex flex-col gap-6 w-full">
                {/* Speech to Text */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1">
                    <Controller
                      name="SPEECH_RECOGNITION_MODEL"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full bg-background border border-border text-foreground">
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
                </div>
                {/* Text to Speech */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1">
                    <Controller
                      name="TTS_MODEL"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full bg-background border border-border text-foreground">
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
                </div>
                {/* Voice */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1">
                    <Controller
                      name="TTS_VOICE"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full bg-background border border-border text-foreground">
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
            </div>

            {/* VAD Config */}
            <div
              className="bg-card rounded-xl border border-border shadow-sm p-8 flex flex-col gap-8 ring-1 ring-primary/30 dark:ring-primary/40 ring-inset"
              style={{ boxShadow: "0 0 0 1px var(--ring-color, #a5b4fc)" }}
            >
              <div className="font-mono text-lg font-bold flex items-center gap-2 text-foreground mb-2">
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
              <div className="flex flex-col gap-6 w-full">
                {/* Sample Rate */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1">
                    <Controller
                      name="VAD_SAMPLE_RATE"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full max-w-[160px] bg-background border border-border text-foreground">
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
                </div>
                {/* Speech Frames */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1 flex items-center gap-2">
                    <Controller
                      name="VAD_SPEECH_FRAMES"
                      control={control}
                      render={({ field }) => (
                        <>
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
                        </>
                      )}
                    />
                  </div>
                </div>
                {/* Silence Frames */}
                <div className="flex items-center gap-4 w-full">
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
                  <div className="flex-1 flex items-center gap-2">
                    <Controller
                      name="VAD_SILENCE_FRAMES"
                      control={control}
                      render={({ field }) => (
                        <>
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
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading || isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg shadow-sm"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
