import svgPaths from "./svg-xs24le692b";
import imgPtDailyPromo101 from "figma:asset/c40c4f4e209437a007039a6d36e30c055e0959d0.png";
import imgPtDailyPromo102 from "figma:asset/dbbf9573801a0f321b44f388b9d3127169bed17f.png";
import imgPtDailyPromo103 from "figma:asset/f10df88a7dca2b1b76d5f9750c38136ffa2e7128.png";
import imgPtDailyPromo104 from "figma:asset/3c3be37181695898c80147511eb974467207b0e9.png";

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
            <g filter="url(#filter0_d_1_4280)" id="handle">
              <circle cx="18" cy="16" fill="var(--fill-0, white)" r="10" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="36" id="filter0_d_1_4280" width="36" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_4280" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_4280" mode="normal" result="shape" />
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

function Frame19() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center text-nowrap">OTW Hotel Promo</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] gap-[8px] items-start leading-[20px] not-italic relative self-stretch shrink-0 text-[#71747d] text-[14px] text-nowrap w-[72px]">
      <p className="relative shrink-0">Product</p>
      <p className="relative shrink-0">Dimension</p>
    </div>
  );
}

function Frame24() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] gap-[8px] grow items-start leading-[20px] min-h-px min-w-px not-italic relative self-stretch shrink-0 text-[#303135] text-[14px] text-nowrap">
      <p className="relative shrink-0">Hotel</p>
      <p className="relative shrink-0">1080*540</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] gap-[8px] items-start leading-[20px] not-italic relative self-stretch shrink-0 text-[#71747d] text-[14px] text-nowrap w-[72px]">
      <p className="relative shrink-0">File size</p>
      <p className="relative shrink-0">Added on</p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] gap-[8px] grow items-start leading-[20px] min-h-px min-w-px not-italic relative self-stretch shrink-0 text-[#303135] text-[14px] text-nowrap">
      <p className="relative shrink-0">128 kb</p>
      <p className="relative shrink-0">20 Oct 2022</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
      <Frame21 />
      <Frame24 />
      <Frame25 />
      <Frame26 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[360px]">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#71747d] text-[16px] text-center text-nowrap">Asset Info</p>
      <Frame23 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start pb-[32px] pt-[132px] px-[32px] right-0 top-0 w-[431px]" data-name="Frame">
      <Frame5 />
      <Frame19 />
      <Frame20 />
    </div>
  );
}

function Details() {
  return (
    <div className="absolute bg-white bottom-0 left-[1008px] top-0 w-[432px]" data-name="Details">
      <VerticalLight />
      <Frame6 />
    </div>
  );
}

function TdsIcSearch() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_search">
          <path clipRule="evenodd" d={svgPaths.p8aebd00} fill="var(--fill-0, #AEB2BE)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function PlaceholderText() {
  return (
    <div className="basis-0 grow h-[22px] min-h-px min-w-px overflow-clip relative shrink-0" data-name="Placeholder Text">
      <p className="absolute font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] left-0 not-italic text-[#71747d] text-[16px] text-nowrap top-0">Search banner by name</p>
    </div>
  );
}

function BgN() {
  return (
    <div className="basis-0 bg-[#f4f7fe] grow min-h-px min-w-px relative rounded-[100px] shrink-0" data-name="BG N100">
      <div aria-hidden="true" className="absolute border border-[#f4f7fe] border-solid inset-0 pointer-events-none rounded-[100px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[12px] py-[10px] relative w-full">
          <TdsIcSearch />
          <PlaceholderText />
        </div>
      </div>
    </div>
  );
}

function Component01Primary() {
  return (
    <div className="bg-[#007bff] content-stretch flex h-[52px] items-center justify-center px-[24px] py-[14px] relative rounded-[8px] shrink-0" data-name="01 Primary">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[18px] text-center text-nowrap text-white">Create New Banner</p>
    </div>
  );
}

function Title() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[40px] items-center left-[268px] pl-[40px] pr-[24px] py-[24px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] top-0 w-[1172px]" data-name="Title">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#303135] text-[24px] text-nowrap">Banners</p>
      <BgN />
      <Component01Primary />
    </div>
  );
}

function TitleSubtext() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">OTW Hotel Promo</p>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0">
      <TitleSubtext />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shrink-0 w-[336px]" data-name="Content">
      <div aria-hidden="true" className="absolute border-2 border-[#007bff] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]" />
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo101} />
      </div>
      <Frame27 />
    </div>
  );
}

function TitleSubtext1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">Car rental promo 1</p>
    </div>
  );
}

function WithTag() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="With Tag">
      <TitleSubtext1 />
    </div>
  );
}

function Content1() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[336px]" data-name="Content">
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo102} />
      </div>
      <WithTag />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0">
      <Content />
      <Content1 />
    </div>
  );
}

function TitleSubtext2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">Flight promo Sriwijaya, NAM air</p>
    </div>
  );
}

function WithTag1() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="With Tag">
      <TitleSubtext2 />
    </div>
  );
}

function Content2() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[336px]" data-name="Content">
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo103} />
      </div>
      <WithTag1 />
    </div>
  );
}

function TitleSubtext3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">First time user</p>
    </div>
  );
}

function WithTag2() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="With Tag">
      <TitleSubtext3 />
    </div>
  );
}

function Content3() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[336px]" data-name="Content">
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo104} />
      </div>
      <WithTag2 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0">
      <Content2 />
      <Content3 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[292px] top-[180px]">
      <Frame28 />
      <Frame29 />
    </div>
  );
}

function TdsIcChevronDown() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="tds_ic_chevron_down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="tds_ic_chevron_down">
          <path d={svgPaths.pd996a00} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Action() {
  return (
    <div className="bg-white content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[8px] relative rounded-[18px] shrink-0" data-name="Action">
      <div aria-hidden="true" className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Sort by</p>
      <TdsIcChevronDown />
    </div>
  );
}

function TdsIcChevronDown1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="tds_ic_chevron_down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="tds_ic_chevron_down">
          <path d={svgPaths.pd996a00} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Action1() {
  return (
    <div className="bg-white content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[8px] relative rounded-[18px] shrink-0" data-name="Action">
      <div aria-hidden="true" className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">All Product</p>
      <TdsIcChevronDown1 />
    </div>
  );
}

function Left() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Left">
      <Action />
      <Action1 />
    </div>
  );
}

function Filter() {
  return (
    <div className="absolute content-stretch flex gap-[140px] items-start left-[292px] top-[124px] w-[692px]" data-name="Filter">
      <Left />
    </div>
  );
}

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
            <g filter="url(#filter0_d_1_4233)" id="Ellipse 76">
              <circle cx="24" cy="22" fill="var(--fill-0, white)" r="16" />
            </g>
            <g id="ic-chevron-left-navigation">
              <path d={svgPaths.p3078ca00} fill="var(--fill-0, #4D4F56)" id="Mask" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="48" id="filter0_d_1_4233" width="48" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_4233" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_4233" mode="normal" result="shape" />
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
          <path d={svgPaths.p5998700} fill="var(--fill-0, #A3CFFF)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <TdsIcHomeOff />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Home</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame15 />
    </div>
  );
}

function ItemExpandSidebar() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame8 />
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

function Frame16() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <IconEmptyIcon />
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] w-[176px]">Banners</p>
      <TdsIcChevronUp />
    </div>
  );
}

function Frame10() {
  return (
    <div className="[grid-area:1_/_1] bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start ml-[28px] mt-0 overflow-clip pl-0 pr-[8px] py-[10px] relative w-[240px]">
      <Frame16 />
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Frame10 />
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

function Frame9() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText />
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-[#e7f2ff] content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative rounded-bl-[8px] rounded-tl-[8px] shrink-0">
      <Frame9 />
    </div>
  );
}

function ItemExpandSidebar2() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame14 />
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

function Frame11() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText1 />
    </div>
  );
}

function ItemExpandSidebar3() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[56px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame11 />
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

function Frame17() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <IconEmptyIcon1 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Logo Assets</p>
      <IcChevronDownNavigation />
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame17 />
    </div>
  );
}

function ItemExpandSidebar4() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame12 />
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

function Frame18() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <TdsIcSetting />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Settings</p>
      <IcChevronDownNavigation1 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame18 />
    </div>
  );
}

function ItemExpandSidebar5() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame13 />
    </div>
  );
}

function Frame7() {
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
          <mask height="6" id="mask0_1_4224" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }} width="11" x="5" y="7">
            <path d={svgPaths.p3504a860} fill="var(--fill-0, white)" id="Mask_2" />
          </mask>
          <g mask="url(#mask0_1_4224)">
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

function ItemExpandSidebar6() {
  return (
    <div className="absolute bg-white inset-[0_81.39%_0_0] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]" data-name="Item Expand Sidebar">
      <LogoTiketHorizontal />
      <ItemIcon />
      <HorizontalLight />
      <Frame7 />
      <RightAction />
    </div>
  );
}

export default function BannersDefault() {
  return (
    <div className="bg-[#f8f9fd] relative size-full" data-name="Banners - Default">
      <Details />
      <Title />
      <Frame22 />
      <Filter />
      <ItemExpandSidebar6 />
    </div>
  );
}