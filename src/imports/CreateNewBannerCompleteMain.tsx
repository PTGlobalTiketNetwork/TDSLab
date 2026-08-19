import svgPaths from "./svg-a3f9pow11j";
import imgPtDailyPromo91 from "figma:asset/c40c4f4e209437a007039a6d36e30c055e0959d0.png";
import imgPtDailyPromo101 from "figma:asset/f9835d9c09820f6777781d67e926f9ae317ae91f.png";
import { imgGroup415 } from "./svg-mric0";

function Icon40NavigationChevronDown() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon 4.0 / Navigation / chevron_down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="ð¨ Color">
          <g id="Rectangle"></g>
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #979797)" id="Mask" />
          <mask height="6" id="mask0_2023_1383" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }} width="11" x="5" y="7">
            <path d={svgPaths.p3504a860} fill="var(--fill-0, white)" id="Mask_2" />
          </mask>
          <g mask="url(#mask0_2023_1383)">
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
    <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#71747d] text-[12px] text-nowrap">
        <p className="leading-[16px]">You’re logged in as</p>
      </div>
      <TextIcon />
    </div>
  );
}

function RightAction() {
  return (
    <div className="absolute content-stretch flex gap-[24px] items-start right-[28px] top-[14px]" data-name="Right Action">
      <Text />
    </div>
  );
}

function TiketHorizontal() {
  return (
    <div className="absolute inset-[8.33%_2.08%] overflow-clip" data-name="tiket horizontal">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 139.917 35">
        <g id="vector">
          <g id="Vector">
            <path d={svgPaths.p1d879780} fill="#0064D2" />
            <path d={svgPaths.p3b29b180} fill="#0064D2" />
            <path d={svgPaths.p1156400} fill="#0064D2" />
            <path d={svgPaths.p13516c80} fill="#0064D2" />
            <path d={svgPaths.p51bdc00} fill="#0064D2" />
            <path d={svgPaths.p11681900} fill="#0064D2" />
            <path d={svgPaths.p14306e80} fill="#0064D2" />
            <path d={svgPaths.p6dea600} fill="#0064D2" />
          </g>
          <path d={svgPaths.p1189280} fill="var(--fill-0, #FEDD00)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function LogoTiketHorizontal() {
  return (
    <div className="absolute h-[42px] left-[28px] overflow-clip top-[15px] w-[146px]" data-name="logo_tiket_horizontal">
      <TiketHorizontal />
    </div>
  );
}

function WithMenu() {
  return (
    <div className="absolute h-[72px] left-0 top-0 w-[1440px]" data-name=".With menu">
      <div className="absolute inset-[-8.33%_-0.56%_-13.89%_-0.56%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1456 88">
          <g filter="url(#filter0_d_2023_1429)" id="Enabled">
            <path d="M8 6H1448V78H8V6Z" fill="var(--fill-0, white)" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="88" id="filter0_d_2023_1429" width="1456" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2023_1429" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_2023_1429" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
      <RightAction />
      <LogoTiketHorizontal />
    </div>
  );
}

function DsBreadcrumbsPieces() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center leading-[20px] not-italic overflow-clip relative shrink-0 text-[#71747d] text-nowrap" data-name=".DS-Breadcrumbs / Ω Pieces">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] relative shrink-0 text-[12px]">Banners</p>
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] relative shrink-0 text-[14px]">{`>`}</p>
    </div>
  );
}

function DsBreadcrumbsPieces1() {
  return (
    <div className="content-stretch flex items-center justify-center overflow-clip px-0 py-[2px] relative shrink-0" data-name=".DS-Breadcrumbs / Ω Pieces">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-nowrap">Create New Banner</p>
    </div>
  );
}

function Breadcrumbs() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Breadcrumbs">
      <DsBreadcrumbsPieces />
      <DsBreadcrumbsPieces1 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[24px_16px]" style={{ maskImage: `url('${imgGroup415}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 16.0002">
        <g id="Group 415">
          <path d="M24 0H0V16.0002H24V0Z" fill="var(--fill-0, #F0F0F0)" id="Vector" />
          <g id="Group">
            <path d={svgPaths.p370ad200} fill="var(--fill-0, #D80027)" id="Vector_2" />
            <path d={svgPaths.p31d13c00} fill="var(--fill-0, #D80027)" id="Vector_3" />
            <path d={svgPaths.p110cdac0} fill="var(--fill-0, #D80027)" id="Vector_4" />
            <path d={svgPaths.p230bb480} fill="var(--fill-0, #D80027)" id="Vector_5" />
          </g>
          <path d="M12 0H0V8.61548H12V0Z" fill="var(--fill-0, #2E52B2)" id="Vector_6" />
          <g id="Group_2">
            <path d={svgPaths.p5f7f980} fill="var(--fill-0, #F0F0F0)" id="Vector_7" />
            <path d={svgPaths.p17d09900} fill="var(--fill-0, #F0F0F0)" id="Vector_8" />
            <path d={svgPaths.p17a5d700} fill="var(--fill-0, #F0F0F0)" id="Vector_9" />
            <path d={svgPaths.p4384e00} fill="var(--fill-0, #F0F0F0)" id="Vector_10" />
            <path d={svgPaths.paea4380} fill="var(--fill-0, #F0F0F0)" id="Vector_11" />
            <path d={svgPaths.p1fddf500} fill="var(--fill-0, #F0F0F0)" id="Vector_12" />
            <path d={svgPaths.p19694900} fill="var(--fill-0, #F0F0F0)" id="Vector_13" />
            <path d={svgPaths.p64eec00} fill="var(--fill-0, #F0F0F0)" id="Vector_14" />
            <path d={svgPaths.p378f25c0} fill="var(--fill-0, #F0F0F0)" id="Vector_15" />
            <path d={svgPaths.p4dc4700} fill="var(--fill-0, #F0F0F0)" id="Vector_16" />
            <path d={svgPaths.p3d6ae580} fill="var(--fill-0, #F0F0F0)" id="Vector_17" />
            <path d={svgPaths.p17a8400} fill="var(--fill-0, #F0F0F0)" id="Vector_18" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Flag() {
  return (
    <div className="h-[16px] relative shrink-0 w-[24px]" data-name="Flag">
      <Group />
    </div>
  );
}

function English() {
  return (
    <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-name="English">
      <Flag />
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#71747d] text-[16px] text-nowrap">EN Translation</p>
    </div>
  );
}

function LanguageBar() {
  return (
    <div className="bg-[#f2f8ff] relative rounded-[4px] shrink-0 w-full" data-name="Language Bar">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[10px] relative w-full">
          <English />
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Frame">
      <LanguageBar />
      <div className="h-[226px] relative rounded-[12px] shrink-0 w-[451px]" data-name="pt_daily_promo (9) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo91} />
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[24px_16px]" style={{ maskImage: `url('${imgGroup415}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 16.0004">
        <g id="Group 415">
          <path d={svgPaths.pcdd2340} fill="var(--fill-0, #F0F0F0)" id="Vector" />
          <g id="Group">
            <path d="M24 0H0V8H24V0Z" fill="var(--fill-0, #D80027)" id="Vector_2" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Flag1() {
  return (
    <div className="h-[16px] relative shrink-0 w-[24px]" data-name="Flag">
      <Group1 />
    </div>
  );
}

function BahasaIndonesia() {
  return (
    <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-name="Bahasa Indonesia">
      <Flag1 />
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#71747d] text-[16px] text-nowrap">{`ID Translation `}</p>
    </div>
  );
}

function LanguageBar1() {
  return (
    <div className="bg-[#f2f8ff] relative rounded-[4px] shrink-0 w-full" data-name="Language Bar">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[10px] relative w-full">
          <BahasaIndonesia />
        </div>
      </div>
    </div>
  );
}

function BlanketBlack() {
  return <div className="[grid-area:1_/_1] bg-[#18191b] h-[226px] ml-0 mt-0 opacity-40 rounded-[12px] w-[451px]" data-name="Blanket/Black" />;
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

function Download() {
  return (
    <div className="[grid-area:1_/_1] bg-white content-stretch flex items-start ml-[206px] mt-[93px] p-[8px] relative rounded-[20px]" data-name="Download">
      <TdsIcDownload />
    </div>
  );
}

function CursorArrow() {
  return (
    <div className="[grid-area:1_/_1] ml-[252px] mt-[145px] relative size-[28px]" data-name="Cursor/Arrow">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="Cursor/Arrow">
          <path d={svgPaths.p3b033c00} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p13e15200} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p1a503700} fill="var(--fill-0, #18191B)" id="Vector_3" />
          <path d={svgPaths.p786fe80} fill="var(--fill-0, #18191B)" id="Vector_4" />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="[grid-area:1_/_1] h-[226px] ml-0 mt-0 relative rounded-[12px] w-[451px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo101} />
      </div>
      <BlanketBlack />
      <Download />
      <CursorArrow />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Frame">
      <LanguageBar1 />
      <Group2 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[24px] items-start justify-center relative shrink-0 w-full" data-name="Frame">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center not-italic relative shrink-0 text-[#303135] text-center w-full">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[30px] relative shrink-0 text-[24px] w-[336px]">Creation done</p>
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[24px] relative shrink-0 text-[18px] text-nowrap">You can use the banner by publishing to promo dashboard or manually download.</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[24px] items-center p-[32px] relative rounded-[8px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0">
      <Frame2 />
      <Frame4 />
    </div>
  );
}

function Component02Secondary() {
  return (
    <div className="h-[52px] relative rounded-[8px] shrink-0 w-[200px]" data-name="02 Secondary">
      <div className="absolute bg-[#e7f2ff] inset-0 rounded-[8px]" data-name="Button Shape" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] left-1/2 not-italic text-[#007bff] text-[18px] text-center text-nowrap top-[calc(50%-12px)] translate-x-[-50%]">Back to Banner List</p>
    </div>
  );
}

function Component01Primary() {
  return (
    <div className="bg-[#007bff] content-stretch flex h-[52px] items-center justify-center px-[98px] py-[14px] relative rounded-[8px] shrink-0 w-[200px]" data-name="01 Primary">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[18px] text-center text-nowrap text-white">Save</p>
    </div>
  );
}

function MainCta() {
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-end relative shrink-0 w-full" data-name="Main CTA">
      <Component02Secondary />
      <Component01Primary />
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-[225px] top-[96px]" data-name="Frame">
      <Breadcrumbs />
      <Frame5 />
      <MainCta />
    </div>
  );
}

export default function CreateNewBannerCompleteMain() {
  return (
    <div className="bg-[#f8f9fd] relative size-full" data-name="Create New Banner - Complete - Main">
      <WithMenu />
      <Frame3 />
    </div>
  );
}