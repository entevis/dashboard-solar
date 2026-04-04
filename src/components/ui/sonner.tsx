"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"

      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0d1c2e",
          "--normal-border": "#c3c6d7",
          "--success-bg": "#ffffff",
          "--success-text": "#0d1c2e",
          "--success-border": "#c3c6d7",
          "--error-bg": "#ffffff",
          "--error-text": "#0d1c2e",
          "--error-border": "#c3c6d7",
          "--border-radius": "10px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
