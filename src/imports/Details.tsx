import svgPaths from "./svg-3n792bvqad";
import imgPtDailyPromo101 from "figma:asset/c40c4f4e209437a007039a6d36e30c055e0959d0.png";

function VerticalLight() {
  return <div className="absolute bg-[#d8dce8] inset-[0_99.77%_0_0]" data-name="Vertical/Light" />;
}

function TdsIcEdit() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="tds_ic_edit">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tds_ic_edit">
          <path clipRule="evenodd" d={svgPaths.p27010400} fill="var(--fill-0, #4D4F56)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center p-[4px] relative shrink-0 w-[64px]" data-name="Frame">
      <TdsIcEdit />
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-center text-nowrap">Edit</p>
    </div>
  );
}

function TdsIcDownload() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="tds_ic_download">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tds_ic_download">
          <path clipRule="evenodd" d={svgPaths.p34d29200} fill="var(--fill-0, #4D4F56)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center p-[4px] relative shrink-0" data-name="Frame">
      <TdsIcDownload />
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-center text-nowrap">Download</p>
    </div>
  );
}

function TdsIcDelete() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="tds_ic_delete">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tds_ic_delete">
          <path clipRule="evenodd" d={svgPaths.p316f1e80} fill="var(--fill-0, #4D4F56)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center p-[4px] relative shrink-0 w-[64px]" data-name="Frame">
      <TdsIcDelete />
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-center text-nowrap">Delete</p>
    </div>
  );
}

function SelectionControlToggle() {
  return (
    <div className="h-[24px] relative shrink-0 w-[36px]" data-name="Selection Control - Toggle">
      <div className="absolute inset-[-16.67%_0_-33.33%_-16.67%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 36">
          <g id="Selection Control - Toggle">
            <rect fill="var(--fill-0, #AEB2BE)" height="24" id="track" rx="12" width="36" x="6" y="4" />
            <g filter="url(#filter0_d_7_1587)" id="handle">
              <circle cx="18" cy="16" fill="var(--fill-0, white)" r="10" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="36" id="filter0_d_7_1587" width="36" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_7_1587" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_7_1587" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center p-[4px] relative shrink-0 w-[64px]" data-name="Frame">
      <SelectionControlToggle />
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-center text-nowrap">Publish</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[#f4f7fe] content-stretch flex gap-[16px] items-start px-[16px] py-[8px] relative rounded-[56px] shrink-0" data-name="Frame">
      <Frame />
      <Frame1 />
      <Frame2 />
      <Frame3 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="Frame">
      <div className="h-[180px] relative rounded-[12px] shrink-0 w-[360px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo101} />
      </div>
      <Frame4 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center text-nowrap">OTW Hotel Promo</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] gap-[8px] items-start leading-[20px] not-italic relative self-stretch shrink-0 text-[#71747d] text-[14px] text-nowrap w-[72px]">
      <p className="relative shrink-0">Product</p>
      <p className="relative shrink-0">Dimension</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] gap-[8px] grow items-start leading-[20px] min-h-px min-w-px not-italic relative self-stretch shrink-0 text-[#303135] text-[14px] text-nowrap">
      <p className="relative shrink-0">Hotel</p>
      <p className="relative shrink-0">1080*540</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] gap-[8px] items-start leading-[20px] not-italic relative self-stretch shrink-0 text-[#71747d] text-[14px] text-nowrap w-[72px]">
      <p className="relative shrink-0">File size</p>
      <p className="relative shrink-0">Added on</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] gap-[8px] grow items-start leading-[20px] min-h-px min-w-px not-italic relative self-stretch shrink-0 text-[#303135] text-[14px] text-nowrap">
      <p className="relative shrink-0">128 kb</p>
      <p className="relative shrink-0">20 Oct 2022</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
      <Frame9 />
      <Frame11 />
      <Frame12 />
      <Frame13 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[360px]">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#71747d] text-[16px] text-center text-nowrap">Asset Info</p>
      <Frame10 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start pb-[32px] pt-[132px] px-[32px] right-0 top-0 w-[431px]" data-name="Frame">
      <Frame5 />
      <Frame7 />
      <Frame8 />
    </div>
  );
}

export default function Details() {
  return (
    <div className="bg-white relative size-full" data-name="Details">
      <VerticalLight />
      <Frame6 />
    </div>
  );
}