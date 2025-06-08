//dashboard/prompt/page.tsx

"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getAuthHeaders } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  prompt: z.string().min(1, { message: "Prompt cannot be empty." }),
  greetingPrompt: z
    .string()
    .min(1, { message: "Welcome message cannot be empty." }),
});

export default function PromptManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      greetingPrompt: "",
    },
  });

  // Remove unused handler and state for welcomeMessage

  useEffect(() => {
    async function fetchPrompts() {
      try {
        // Fetch system prompt
        const sysRes = await fetch("https://ai.rajatkhandelwal.com/getprompt", {
          headers: getAuthHeaders(),
        });
        if (!sysRes.ok) throw new Error("Failed to fetch system prompt");
        const sysData = await sysRes.json();
        form.setValue("prompt", sysData.prompt || "");

        // Fetch greeting prompt
        const greetRes = await fetch(
          "https://ai.rajatkhandelwal.com/greeting",
          {
            headers: getAuthHeaders(),
          }
        );
        if (!greetRes.ok) throw new Error("Failed to fetch greeting prompt");
        const greetData = await greetRes.json();
        // Fallback: supports both {greetingPrompt: "..."} or {greeting: "..."}
        form.setValue(
          "greetingPrompt",
          greetData.greetingPrompt || greetData.greeting || ""
        );
      } catch (error) {
        console.error("Error fetching prompts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load prompts. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompts();
  }, [form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      // Update system prompt
      const sysRes = await fetch("https://ai.rajatkhandelwal.com/setprompt", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt: values.prompt }),
      });
      if (!sysRes.ok) throw new Error("Failed to update system prompt");

      // Update greeting prompt
      const greetRes = await fetch(
        "https://ai.rajatkhandelwal.com/setgreeting",
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ greetingPrompt: values.greetingPrompt }),
        }
      );
      if (!greetRes.ok) throw new Error("Failed to update greeting prompt");

      toast({
        title: "Success",
        description: "Prompts have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating prompts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update prompts. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Prompt Management  {"("} ⚠️ Work In Progress & Non Editable {")"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Prompt Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-32">
                <div className="h-5 w-full animate-pulse rounded bg-muted"></div>
              </div>
              <div className="h-32 w-full">
                <div className="h-full w-full animate-pulse rounded bg-muted"></div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* System Prompt */}
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the AI system prompt here..."
                          value={field.value}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(
                              /[^a-zA-Z0-9 .,!?()\-_:;\[\]{}"']/g,
                              ""
                            );
                            field.onChange(sanitized);
                          }}
                          className="min-h-[200px] resize-y"
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt defines how the AI assistant will behave
                        when interacting with users.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Welcome Message Prompt */}
                <FormField
                  control={form.control}
                  name="greetingPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Welcome Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your welcome message..."
                          value={field.value}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(
                              /[^a-zA-Z0-9\s]/g,
                              ""
                            );
                            field.onChange(sanitized);
                          }}
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be shown as the AI's initial greeting
                        to users.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
