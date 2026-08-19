import svgPaths from "./svg-aiibt4855e";

function TiketHorizontal() {
  return (
    <div className="absolute inset-[8.33%_2.08%] overflow-clip" data-name="tiket horizontal">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 161 35">
        <g id="vector">
          <g id="Vector">
            <path d={svgPaths.p17d6db80} fill="#0064D2" />
            <path d={svgPaths.p221be7d0} fill="#0064D2" />
            <path d={svgPaths.p1793de00} fill="#0064D2" />
            <path d={svgPaths.p313ed500} fill="#0064D2" />
            <path d={svgPaths.p1404b100} fill="#0064D2" />
            <path d={svgPaths.p380c2c00} fill="#0064D2" />
            <path d={svgPaths.p86966c0} fill="#0064D2" />
            <path d={svgPaths.p15d18f00} fill="#0064D2" />
          </g>
          <path d={svgPaths.p9fd6a00} fill="var(--fill-0, #FEDD00)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function LogoTiketHorizontal() {
  return (
    <div className="absolute h-[42px] left-[28px] overflow-clip top-[29px] w-[168px]" data-name="logo_tiket_horizontal">
      <TiketHorizontal />
    </div>
  );
}

function ItemIcon() {
  return (
    <div className="absolute left-[252px] size-[32px] top-[34px]" data-name="Item Icon">
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

function HorizontalLight() {
  return <div className="absolute bg-[#d8dce8] h-px left-0 top-[100px] w-[268px]" data-name="Horizontal/Light" />;
}

function TdsIcHomeOff() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_home_off">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_home_off">
          <path d={svgPaths.p27aea500} fill="var(--fill-0, #A3CFFF)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <TdsIcHomeOff />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Home</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame8 />
    </div>
  );
}

function ItemExpandSidebar() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame1 />
    </div>
  );
}

function IconEmptyIcon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon / Empty icon">
      <div className="absolute bg-[#a3cfff] inset-0 rounded-[4px]" data-name="Empty icon" />
    </div>
  );
}

function TdsIcChevronUp() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_chevron_up">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_chevron_up">
          <path d={svgPaths.p2ea41700} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <IconEmptyIcon />
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] w-[176px]">Banners</p>
      <TdsIcChevronUp />
    </div>
  );
}

function Frame3() {
  return (
    <div className="[grid-area:1_/_1] bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start ml-[28px] mt-0 overflow-clip pl-0 pr-[8px] py-[10px] relative w-[240px]">
      <Frame9 />
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Frame3 />
      <div className="[grid-area:1_/_1] bg-[#007bff] h-[40px] ml-0 mt-0 w-[4px]" />
    </div>
  );
}

function ItemExpandSidebar1() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shrink-0" data-name="Item Expand Sidebar">
      <Group />
    </div>
  );
}

function IconText() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Icon + Text">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] w-[176px]">Daily Promo</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText />
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#e7f2ff] content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative rounded-bl-[8px] rounded-tl-[8px] shrink-0">
      <Frame2 />
    </div>
  );
}

function ItemExpandSidebar2() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame7 />
    </div>
  );
}

function IconText1() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Icon + Text">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Big Campaign</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText1 />
    </div>
  );
}

function ItemExpandSidebar3() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[56px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame4 />
    </div>
  );
}

function IconEmptyIcon1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon / Empty icon">
      <div className="absolute bg-[#a3cfff] inset-0 rounded-[4px]" data-name="Empty icon" />
    </div>
  );
}

function IcChevronDownNavigation() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="ic-chevron-down-navigation">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="ic-chevron-down-navigation">
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #4D4F56)" id="Mask" />
        </g>
      </svg>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <IconEmptyIcon1 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Logo Assets</p>
      <IcChevronDownNavigation />
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame10 />
    </div>
  );
}

function ItemExpandSidebar4() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame5 />
    </div>
  );
}

function TdsIcSetting() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_setting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_setting">
          <path clipRule="evenodd" d={svgPaths.p5b9ca80} fill="var(--fill-0, #A3CFFF)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function IcChevronDownNavigation1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="ic-chevron-down-navigation">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="ic-chevron-down-navigation">
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #4D4F56)" id="Mask" />
        </g>
      </svg>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <TdsIcSetting />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Settings</p>
      <IcChevronDownNavigation1 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame11 />
    </div>
  );
}

function ItemExpandSidebar5() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame6 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] items-start left-0 top-[121px]" data-name="Frame">
      <ItemExpandSidebar />
      <ItemExpandSidebar1 />
      <ItemExpandSidebar2 />
      <ItemExpandSidebar3 />
      <ItemExpandSidebar4 />
      <ItemExpandSidebar5 />
    </div>
  );
}

function Icon40NavigationChevronDown() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon 4.0 / Navigation / chevron_down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="ð¨ Color">
          <g id="Rectangle"></g>
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #979797)" id="Mask" />
          <mask height="6" id="mask0_7_3708" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }} width="11" x="5" y="7">
            <path d={svgPaths.p3504a860} fill="var(--fill-0, white)" id="Mask_2" />
          </mask>
          <g mask="url(#mask0_7_3708)">
            <rect fill="var(--fill-0, #4D4F56)" height="20" id="ð¨ Color_2" width="20" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TextIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0" data-name="Text + Icon">
      <div className="flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap text-right">
        <p className="leading-[20px]">Michael Fernanlie</p>
      </div>
      <Icon40NavigationChevronDown />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#71747d] text-[12px] text-nowrap">
        <p className="leading-[16px]">You’re logged in as</p>
      </div>
      <TextIcon />
    </div>
  );
}

function RightAction() {
  return (
    <div className="absolute bottom-[20px] content-stretch flex gap-[24px] items-start left-0 px-[28px] py-0 w-[268px]" data-name="Right Action">
      <Text />
    </div>
  );
}

export default function ItemExpandSidebar6() {
  return (
    <div className="bg-white relative shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] size-full" data-name="Item Expand Sidebar">
      <LogoTiketHorizontal />
      <ItemIcon />
      <HorizontalLight />
      <Frame />
      <RightAction />
    </div>
  );
}