import svgPaths from "./svg-z4vno468sm";

export default function ItemIcon() {
  return (
    <div className="relative size-full" data-name="Item Icon">
      <div className="absolute inset-[-18.75%_-25%_-31.25%_-25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
          <g id="Item Icon">
            <g filter="url(#filter0_d_7_3714)" id="Ellipse 76">
              <circle cx="24" cy="22" fill="var(--fill-0, white)" r="16" />
            </g>
            <g id="ic-chevron-left-navigation">
              <path d={svgPaths.p3078ca00} fill="var(--fill-0, #4D4F56)" id="Mask" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="48" id="filter0_d_7_3714" width="48" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_7_3714" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_7_3714" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}