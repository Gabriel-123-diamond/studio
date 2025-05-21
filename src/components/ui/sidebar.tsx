
"use client"

import * as React from "react"
import NextLink from 'next/link';
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem" // Default width
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3.5rem" // Slightly wider for icon-only state
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open

    const setOpen = React.useCallback(
      (value: boolean | ((currentOpen: boolean) => boolean)) => {
        const newOpenState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(newOpenState);
        } else {
          _setOpen(newOpenState);
        }
        try {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${newOpenState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        } catch (error) {
          console.warn("Could not set sidebar cookie:", error);
        }
      },
      [setOpenProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((current) => !current)
        : setOpen((current) => !current)
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])
    
    React.useEffect(() => { // Initialize open state from cookie if available
      try {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split('=')[1];
        if (cookieValue !== undefined && (openProp === undefined)) { // Only if not controlled
          _setOpen(cookieValue === 'true');
        }
      } catch (error) {
        console.warn("Could not read sidebar cookie:", error);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openProp]);


    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={100}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "icon", 
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none" && !isMobile) {
      return (
        <div
          data-sidebar="sidebar"
          data-variant={variant}
          data-side={side}
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            variant === "floating" || variant === "inset" ? "p-2" : (side === "left" ? "border-r" : "border-l"),
             variant === "floating" && "rounded-lg border shadow",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }
    
    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden" 
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group/sidebar-internal peer hidden md:block text-sidebar-foreground" 
        data-state={state} 
        data-collapsible={collapsible} 
        data-variant={variant}
        data-side={side}
      >
        <div
          className={cn(
            "relative h-svh bg-transparent transition-[width] duration-300 ease-in-out",
            state === "expanded" ? "w-[--sidebar-width]" : (collapsible === "icon" ? "w-[--sidebar-width-icon]" : "w-0"),
             (variant === "floating" || variant === "inset") && state === "expanded" && "w-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
             (variant === "floating" || variant === "inset") && state === "collapsed" && collapsible === "icon" && "w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]",
            collapsible === "offcanvas" && state === "collapsed" && "w-0"
          )}
        />
        <div
          className={cn(
            "fixed inset-y-0 z-20 hidden h-svh flex-col transition-[width,left,right] duration-300 ease-in-out md:flex",
            state === "expanded" ? "w-[--sidebar-width]" : (collapsible === "icon" ? "w-[--sidebar-width-icon]" : "w-0"),
            side === "left" ? "left-0" : "right-0",
            collapsible === "offcanvas" && state === "collapsed" && (side === "left" ? "left-[calc(var(--sidebar-width)*-1)]" : "right-[calc(var(--sidebar-width)*-1)]"),
             (variant === "floating" || variant === "inset") ? "p-2" : "",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar" 
            className={cn("flex h-full w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
             (variant === "sidebar" && (side === "left" ? "border-r" : "border-l")),
             (variant === "floating" || variant === "inset") && "rounded-lg border shadow"
            )}
          >
            {children}
          </div>
          {collapsible !== "none" && <SidebarRail />}
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"


const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 focus-visible:ring-sidebar-ring", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar, state, isMobile } = useSidebar();
  if (isMobile) return null; 

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-30 hidden w-2 -translate-x-1/2 cursor-pointer items-center justify-center transition-all duration-300 ease-linear group-data-[collapsible=offcanvas]/sidebar-internal:hidden md:flex",
        "group-data-[side=left]/sidebar-internal:-right-1 group-data-[side=right]/sidebar-internal:-left-1",
        "hover:bg-sidebar-border/50 rounded-full",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]]/sidebar-internal_&]:cursor-e-resize [[data-side=right][data-state=collapsed]]/sidebar-internal_&]:cursor-w-resize",
        state === "collapsed" && "opacity-0 group-hover/sidebar-wrapper:opacity-100", 
        className
      )}
      {...props}
    >
    <div className="h-8 w-1 bg-sidebar-border/80 rounded-full group-hover/sidebar-wrapper:bg-sidebar-primary/50"/>
    </button>
  );
});
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main"> 
>(({ className, ...props }, ref) => {
  return (
    <main 
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background transition-[margin-left,margin-right] duration-300 ease-in-out",
        "md:group-data-[state=expanded]/sidebar-internal:group-data-[side=left]/sidebar-internal:peer-data-[variant=sidebar]:ml-[var(--sidebar-width)]",
        "md:group-data-[state=expanded]/sidebar-internal:group-data-[side=right]/sidebar-internal:peer-data-[variant=sidebar]:mr-[var(--sidebar-width)]",
        "md:group-data-[state=collapsed]/sidebar-internal:group-data-[collapsible=icon]/sidebar-internal:group-data-[side=left]/sidebar-internal:peer-data-[variant=sidebar]:ml-[var(--sidebar-width-icon)]",
        "md:group-data-[state=collapsed]/sidebar-internal:group-data-[collapsible=icon]/sidebar-internal:group-data-[side=right]/sidebar-internal:peer-data-[variant=sidebar]:mr-[var(--sidebar-width-icon)]",
        
        "peer-data-[variant=inset]:min-h-[calc(100svh_-_theme(spacing.4))]",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-lg",
        "md:group-data-[state=expanded]/sidebar-internal:group-data-[side=left]/sidebar-internal:peer-data-[variant=inset]:ml-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
        "md:group-data-[state=expanded]/sidebar-internal:group-data-[side=right]/sidebar-internal:peer-data-[variant=inset]:mr-[calc(var(--sidebar-width)_+_theme(spacing.4))]",
        "md:group-data-[state=collapsed]/sidebar-internal:group-data-[collapsible=icon]/sidebar-internal:group-data-[side=left]/sidebar-internal:peer-data-[variant=inset]:ml-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]",
        "md:group-data-[state=collapsed]/sidebar-internal:group-data-[collapsible=icon]/sidebar-internal:group-data-[side=right]/sidebar-internal:peer-data-[variant=inset]:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]",

        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-9 w-full bg-sidebar-accent/50 shadow-none border-sidebar-border placeholder:text-sidebar-foreground/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:bg-sidebar",
        "group-data-[state=collapsed]/sidebar-internal:hidden", 
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2 group-data-[state=collapsed]/sidebar-internal:items-center", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2 mt-auto group-data-[state=collapsed]/sidebar-internal:items-center", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 my-1 w-auto bg-sidebar-border", 
        "group-data-[state=collapsed]/sidebar-internal:mx-auto group-data-[state=collapsed]/sidebar-internal:my-2 group-data-[state=collapsed]/sidebar-internal:h-auto group-data-[state=collapsed]/sidebar-internal:w-3/4",
      className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content" 
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-auto",
        "group-data-[state=collapsed]/sidebar-internal:items-center group-data-[state=collapsed]/sidebar-internal:overflow-visible", 
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-1", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-opacity duration-200 focus-visible:ring-2",
        "group-data-[state=collapsed]/sidebar-internal:sr-only", 
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-2 top-1.5 flex aspect-square w-6 items-center justify-center rounded-md p-0 text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 after:md:hidden", 
        "group-data-[state=collapsed]/sidebar-internal:hidden", 
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", 
      "group-data-[state=collapsed]/sidebar-internal:w-auto", 
    className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all duration-150 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[state=collapsed]/sidebar-internal:justify-center group-data-[state=collapsed]/sidebar-internal:h-9 group-data-[state=collapsed]/sidebar-internal:w-9 group-data-[state=collapsed]/sidebar-internal:p-2 group-data-[state=collapsed]/sidebar-internal:[&>span:last-child]:hidden [&>svg]:size-5 [&>svg]:shrink-0 group-data-[state=collapsed]/sidebar-internal:[&>svg]:size-5",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "border border-sidebar-border bg-transparent shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-accent",
      },
      size: { 
        default: "h-9 text-sm",
        sm: "h-8 text-xs [&>svg]:size-4 group-data-[state=collapsed]/sidebar-internal:[&>svg]:size-4",
        lg: "h-10 text-base [&>svg]:size-6 group-data-[state=collapsed]/sidebar-internal:[&>svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type SidebarMenuButtonProps = 
  (React.ComponentPropsWithoutRef<"button"> | (Omit<React.ComponentPropsWithoutRef<typeof NextLink>, 'href'> & { href: string })) & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>;


const SidebarMenuButton = React.forwardRef<
  HTMLElement,
  SidebarMenuButtonProps
>(
  (
    {
      asChild = false,
      isActive = false,
      variant, 
      size,    
      tooltip,
      className,
      children,
      href,
      ...props
    },
    ref
  ) => {
    const { isMobile, state: sidebarState, open: sidebarOpen } = useSidebar();

    let RenderComp: React.ElementType = "button";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentProps: any = {
      ref,
      "data-sidebar": "menu-button",
      "data-active": isActive,
      className: cn(sidebarMenuButtonVariants({ variant, size, className })),
      ...props,
    };

    if (asChild) {
      RenderComp = Slot;
    } else if (href) {
      RenderComp = NextLink;
      componentProps.href = href;
    }
    
    if (RenderComp === "button" && componentProps.href !== undefined) {
      delete componentProps.href; 
    }
    
    const buttonElement = (
      <RenderComp {...componentProps}>
        {children}
      </RenderComp>
    );

    if (!tooltip) {
      return buttonElement;
    }

    const tooltipContentProps: React.ComponentProps<typeof TooltipContent> = 
        typeof tooltip === "string" ? { children: tooltip } : tooltip;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={8}
          className="bg-sidebar text-sidebar-foreground border-sidebar-border"
          hidden={sidebarState !== "collapsed" || isMobile || sidebarOpen} 
          {...tooltipContentProps}
        />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";


const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1.5 top-1/2 -translate-y-1/2 flex aspect-square w-6 items-center justify-center rounded-md p-0 text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4",
        "group-data-[state=collapsed]/sidebar-internal:hidden", 
        showOnHover && "opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-xs font-medium tabular-nums text-sidebar-primary-foreground select-none pointer-events-none",
      "group-data-[state=collapsed]/sidebar-internal:hidden", 
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-primary-foreground",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = true, ...props }, ref) => {
  const width = React.useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, [])
  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("flex h-9 items-center gap-2.5 rounded-md px-2 group-data-[state=collapsed]/sidebar-internal:justify-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton className="size-5 rounded-md bg-sidebar-foreground/10" data-sidebar="menu-skeleton-icon" />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[var(--skeleton-width)] rounded-sm bg-sidebar-foreground/10 group-data-[state=collapsed]/sidebar-internal:hidden"
        data-sidebar="menu-skeleton-text"
        style={{ "--skeleton-width": width } as React.CSSProperties}
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "ml-[calc(theme(spacing.2)_+_theme(spacing.5))] flex list-none min-w-0 flex-col gap-0.5 border-l border-sidebar-border pl-2.5 py-1",
      "group-data-[state=collapsed]/sidebar-internal:hidden", 
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef< 
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => 
  <li ref={ref} className={cn("relative", className)} {...props} />
)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"


type SidebarMenuSubButtonProps = 
  (React.ComponentPropsWithoutRef<"button"> | (Omit<React.ComponentPropsWithoutRef<typeof NextLink>, 'href'> & { href: string })) & {
    asChild?: boolean;
    isActive?: boolean;
    size?: "sm" | "default" | "lg"; 
  };

const SidebarMenuSubButton = React.forwardRef<
  HTMLElement, 
  SidebarMenuSubButtonProps
>(({ asChild = false, size = "default", isActive, className, href, children, ...props }, ref) => {
  
  let RenderComp: React.ElementType = "button";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const componentProps: any = {
    ref,
    "data-sidebar": "menu-sub-button",
    "data-active": isActive,
    className: cn(
      "flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sidebar-foreground/80 outline-none ring-sidebar-ring transition-colors duration-150 ease-in-out hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground focus-visible:ring-1 focus-visible:ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
      size === "sm" && "h-7 text-xs [&>svg]:size-3.5",
      size === "default" && "h-8 text-sm", 
      size === "lg" && "h-9 text-sm [&>svg]:size-5", 
      "group-data-[state=collapsed]/sidebar-internal:hidden", 
      className
    ),
    ...props
  };

  if (asChild) {
    RenderComp = Slot;
  } else if (href) {
    RenderComp = NextLink;
    componentProps.href = href;
  }
  
  if (RenderComp === "button" && componentProps.href !== undefined) {
      delete componentProps.href;
  }

  return (
    <RenderComp {...componentProps}>
      {children}
    </RenderComp>
  );
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

    