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
}

export function TiketStepper({ 
  steps, 
  currentStep, 
  maxStepReached = 1, 
  onStepClick,
  className = ''
}: TiketStepperProps) {
  return (
    <div className={`flex items-center gap-[8px] ${className}`}>
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
                className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                  currentStep >= step.id
                    ? 'bg-[#007bff] text-white'
                    : 'border border-[#aeb2be] text-[#71747d] bg-white'
                } ${isClickable ? 'group-hover:bg-[#0064D2]' : ''}`}
              >
                {step.id}
              </div>
              
              {/* Step Label */}
              <span
                className={`text-[14px] leading-[20px] ${
                  currentStep >= step.id ? 'text-[#303135] font-normal' : 'text-[#71747d]'
                } ${isClickable ? 'group-hover:text-[#007bff]' : ''}`}
                style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-[24px] h-[24px] relative flex items-center">
                <div className="w-full h-[1px] bg-[#c0c3cf]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
