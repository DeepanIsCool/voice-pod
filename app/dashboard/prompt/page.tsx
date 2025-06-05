"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { getAuthHeaders } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: "Prompt cannot be empty.",
  }),
})

export default function PromptManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  })

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const response = await fetch("https://ai.rajatkhandelwal.com/getprompt", {
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch prompt")
        }

        const data = await response.json()
        form.setValue("prompt", data.prompt || "")
      } catch (error) {
        console.error("Error fetching prompt:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load prompt. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrompt()
  }, [form, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    try {
      const response = await fetch("https://ai.rajatkhandelwal.com/setprompt", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt: values.prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to update prompt")
      }

      toast({
        title: "Success",
        description: "Prompt has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating prompt:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update prompt. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Prompt Management</h1>
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the AI system prompt here..."
                          className="min-h-[200px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt defines how the AI assistant will behave when interacting with users.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving || isLoading}>
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
  )
}
