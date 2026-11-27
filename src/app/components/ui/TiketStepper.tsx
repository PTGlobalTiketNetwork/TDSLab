/**
 * TiketStepper Component
 * 
 * Source of Truth: Wizard Navigation bar (Step 1-4) in CreateBanner
 * 
 * Features:
 * - Numbered step circles with active/inactive states
 * - Connector lines between steps
 * - Jump to previously completed steps
 * - Disabled future steps
 * - Hover effects for clickable steps
 * 
 * @example
 * <TiketStepper
 *   steps={[
 *     { id: 1, label: 'Banner Category' },
 *     { id: 2, label: 'Select Layout' },
 *     { id: 3, label: 'Content nudge' },
 *     { id: 4, label: 'Key visual & logo' }
 *   ]}
 *   currentStep={2}
 *   maxStepReached={3}
 *   onStepClick={(stepId) => setCurrentStep(stepId)}
 * />
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface TiketStepItem {
  id: number;
  label: string;
}

export interface TiketStepperProps {
  steps: TiketStepItem[];
  currentStep: number;
  maxStepReached?: number;
  onStepClick: (stepId: number) => void;
  className?: string;
  /** 'compact': for a fixed sticky bar (e.g. scrolled header) — sized directly (20px circle, 16px label) instead of CSS `zoom`, so the label never renders below 16px. */
  size?: 'default' | 'compact';
  /** When provided, a back chevron renders to the left of the steps (e.g. to leave the flow — the caller decides whether that needs an unsaved-changes confirmation first). */
  onBack?: () => void;
}

export function TiketStepper({
  steps,
  currentStep,
  maxStepReached = 1,
  onStepClick,
  className = '',
  size = 'default',
  onBack,
}: TiketStepperProps) {
  const compact = size === 'compact';
  const circleSize = compact ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]';
  const circleText = compact ? 'text-[11px]' : 'text-[12px]';
  const labelText = compact ? 'text-[16px] leading-[20px]' : 'text-[14px] leading-[20px]';
  const connectorSize = compact ? 'w-[18px] h-[20px]' : 'w-[24px] h-[24px]';
  return (
    <div className={`flex items-center gap-[8px] ${className}`}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className={`flex items-center justify-center ${circleSize} rounded-full text-[#71747d] hover:text-[#007bff] hover:bg-[#e7f2ff] transition-colors shrink-0`}
        >
          <ChevronLeft size={compact ? 14 : 16} />
        </button>
      )}
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isClickable = step.id <= maxStepReached;
        const isFuture = !isClickable;

        return (
          <div
            key={step.id}
            className={`flex items-center gap-[8px] ${isClickable ? 'cursor-pointer group' : 'cursor-not-allowed text-[#c0c3cf]'}`}
            onClick={() => {
              if (isClickable) {
                onStepClick(step.id);
              }
            }}
          >
            <div className="flex items-center gap-[8px]">
              {/* Step Number Circle */}
              <div
                className={`${circleSize} rounded-full flex items-center justify-center ${circleText} font-semibold transition-colors shrink-0 ${
                  currentStep >= step.id
                    ? 'bg-[#007bff] text-white'
                    : 'border border-[#aeb2be] text-[#71747d] bg-white'
                }`}
              >
                {step.id}
              </div>

              {/* Step Label */}
              <span
                className={`${labelText} whitespace-nowrap ${
                  currentStep >= step.id ? 'text-[#303135] font-normal' : 'text-[#71747d]'
                } ${isClickable ? 'group-hover:text-[#007bff]' : ''}`}
                style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`${connectorSize} relative flex items-center shrink-0`}>
                <div className="w-full h-[1px] bg-[#c0c3cf]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
