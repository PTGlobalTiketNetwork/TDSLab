/**
 * TiketSwitch Component
 * 
 * Source of Truth: Campaign Logo toggle in FormStep3
 * 
 * Features:
 * - iOS-style toggle switch
 * - Gray when off (#E9EBEF), Blue when on (#007BFF)
 * - Smooth transition animation
 * - Built on Radix UI Switch primitive
 * 
 * @example
 * <TiketSwitch
 *   id="campaign-logo"
 *   checked={showLogo}
 *   onCheckedChange={setShowLogo}
 * />
 */

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "./utils";

export interface TiketSwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {}

export const TiketSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  TiketSwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#007BFF] data-[state=unchecked]:bg-[#E9EBEF]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
TiketSwitch.displayName = "TiketSwitch";
