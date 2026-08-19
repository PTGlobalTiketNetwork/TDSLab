import svgPaths from "./svg-111fg44qm5";

export default function SwitcherVariant() {
  return (
    <div className="h-[22px] relative w-[320px]" data-name="Switcher/Variant3">
      <div className="absolute inset-[40.91%_0]" data-name="Track - Default">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 320 4">
          <path clipRule="evenodd" d="M0 0V4H320V0H0Z" fill="var(--fill-0, #C0C3CF)" fillRule="evenodd" id="Track - Default" />
        </svg>
      </div>
      <div className="absolute inset-[40.91%_17.5%_40.91%_0]" data-name="Track - Active">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 264 4">
          <path clipRule="evenodd" d="M0 0V4H264V0H0Z" fill="var(--fill-0, #007BFF)" fillRule="evenodd" id="Track - Active" />
        </svg>
      </div>
      <div className="absolute inset-[0_14.69%_0_78.44%]" data-name="Dot Slider - Right">
        <div className="absolute inset-[-27.27%_-36.36%_-45.45%_-36.36%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 38 38">
            <g filter="url(#filter0_d_2046_516)" id="Dot Slider - Right">
              <path clipRule="evenodd" d={svgPaths.p6073400} fill="var(--fill-0, white)" fillRule="evenodd" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="38" id="filter0_d_2046_516" width="38" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="4" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2046_516" />
                <feBlend in="SourceGraphic" in2="effect1_dropShadow_2046_516" mode="normal" result="shape" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}