"use client";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useWorkspace } from "./workspace-context";
export default function WorkspaceLink(props: ComponentProps<typeof NextLink>) {
  const workspace = useWorkspace();
  return (
    <NextLink
      {...props}
      href={
        typeof props.href === "string" ? workspace.href(props.href) : props.href
      }
    />
  );
}
