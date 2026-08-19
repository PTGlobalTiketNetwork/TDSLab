import svgPaths from "./svg-qce3h4ttqq";
import { imgGroup415 } from "./svg-sg07d";

function Icon40NavigationChevronDown() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon 4.0 / Navigation / chevron_down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="ð¨ Color">
          <g id="Rectangle"></g>
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #979797)" id="Mask" />
          <mask height="6" id="mask0_10_15255" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }} width="11" x="5" y="7">
            <path d={svgPaths.p3504a860} fill="var(--fill-0, white)" id="Mask_2" />
          </mask>
          <g mask="url(#mask0_10_15255)">
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
          <g filter="url(#filter0_d_10_15324)" id="Enabled">
            <path d="M8 6H1448V78H8V6Z" fill="var(--fill-0, white)" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="88" id="filter0_d_10_15324" width="1456" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_10_15324" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_10_15324" mode="normal" result="shape" />
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

function Box() {
  return (
    <div className="bg-[#007bff] overflow-clip relative rounded-[100px] shrink-0 size-[24px]" data-name="Box">
      <div className="absolute flex flex-col font-['Tiket_Odyssey_Text:SemiBold',sans-serif] justify-center leading-[0] left-[12px] not-italic size-[20px] text-[12px] text-center text-white top-[12px] translate-x-[-50%] translate-y-[-50%]">
        <p className="leading-[16px]">1</p>
      </div>
    </div>
  );
}

function Line() {
  return <div className="absolute bg-[#c0c3cf] h-px left-0 top-[12px] w-[24px]" data-name="Line" />;
}

function LineV() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name=".Line / V2">
      <Line />
    </div>
  );
}

function HorizontalStep() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name=".Horizontal-Step">
      <Box />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">Select Layout</p>
      <LineV />
    </div>
  );
}

function Box1() {
  return (
    <div className="relative rounded-[100px] shrink-0 size-[24px]" data-name="Box">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute flex flex-col font-['Tiket_Odyssey_Text:SemiBold',sans-serif] justify-center leading-[0] left-[12px] not-italic size-[20px] text-[#71747d] text-[12px] text-center top-[12px] translate-x-[-50%] translate-y-[-50%]">
          <p className="leading-[16px]">2</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#aeb2be] border-solid inset-0 pointer-events-none rounded-[100px]" />
    </div>
  );
}

function Line1() {
  return <div className="absolute bg-[#c0c3cf] h-px left-0 top-[12px] w-[24px]" data-name="Line" />;
}

function LineV1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name=".Line / V2">
      <Line1 />
    </div>
  );
}

function HorizontalStep1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name=".Horizontal-Step">
      <Box1 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#71747d] text-[14px] text-nowrap">Content nudge</p>
      <LineV1 />
    </div>
  );
}

function Box2() {
  return (
    <div className="relative rounded-[100px] shrink-0 size-[24px]" data-name="Box">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute flex flex-col font-['Tiket_Odyssey_Text:SemiBold',sans-serif] justify-center leading-[0] left-[12px] not-italic size-[20px] text-[#71747d] text-[12px] text-center top-[12px] translate-x-[-50%] translate-y-[-50%]">
          <p className="leading-[16px]">3</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#aeb2be] border-solid inset-0 pointer-events-none rounded-[100px]" />
    </div>
  );
}

function HorizontalStep2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name=".Horizontal-Step">
      <Box2 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#71747d] text-[14px] text-nowrap">{`Key visual & logo`}</p>
    </div>
  );
}

function ProgressStepHorizontal() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Progress Step - Horizontal">
      <HorizontalStep />
      <HorizontalStep1 />
      <HorizontalStep2 />
    </div>
  );
}

function ProgressStepHorizontal1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Progress Step - Horizontal">
      <ProgressStepHorizontal />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Frame">
      <Breadcrumbs />
      <ProgressStepHorizontal1 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Frame">
      <div className="content-stretch flex items-start pb-[16px] pt-[24px] px-[24px] relative w-full">
        <div className="flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#303135] text-[18px] text-nowrap">
          <p className="leading-[24px]">Select Layout</p>
        </div>
      </div>
    </div>
  );
}

function DsHorizontalLight() {
  return <div className="bg-[#d8dce8] h-px shrink-0 w-full" data-name="DS-Horizontal/Light" />;
}

function PlaceholderContainer() {
  return (
    <div className="basis-0 grow h-[22px] min-h-px min-w-px overflow-clip relative shrink-0" data-name="Placeholder Container">
      <p className="absolute font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] left-0 not-italic text-[#71747d] text-[16px] text-nowrap top-0">Banner Name</p>
    </div>
  );
}

function Box3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Box">
      <div aria-hidden="true" className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[18px] relative w-full">
          <PlaceholderContainer />
        </div>
      </div>
    </div>
  );
}

function FormDropdown() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Form - Dropdown">
      <Box3 />
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Daily Promo</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio1 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Big Campaign</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0" data-name="Frame">
      <Frame2 />
      <Frame3 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[632px]" data-name="Frame">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Promo Type</p>
      <Frame4 />
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio2 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">General (Blue)</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio3() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio3 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">NHA (Pink)</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio4() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio4 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">ToDos (Purple)</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio5() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio5 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Transports (Green)</p>
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[200px]">
      <Frame6 />
      <Frame7 />
      <Frame8 />
      <Frame9 />
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio6() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <SelectionControlRadioSelectionControlRadio6 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Manual Upload</p>
    </div>
  );
}

function TitleSubtext() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0" data-name="Title+subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] relative shrink-0 text-[#303135] text-[16px] w-[320px]">Upload file</p>
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] relative shrink-0 text-[#71747d] text-[14px] w-[320px]">Kamu dapat mengunduh 5 file. format berkas yang diterima: .pdf (maks. 25 MB), .png atau .jpg.</p>
    </div>
  );
}

function TdsIcUpload() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_upload">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_upload">
          <path clipRule="evenodd" d={svgPaths.p3ee03700} fill="var(--fill-0, #AEB2BE)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function IconText() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="Icon + Text">
      <TdsIcUpload />
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#aeb2be] text-[16px] text-center text-nowrap">Browse files (1/1)</p>
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Content">
      <div className="h-[0.001px] shrink-0 w-[64px]" data-name="Min width 84px" />
      <IconText />
    </div>
  );
}

function Button02Secondary() {
  return (
    <div className="bg-[#d8dce8] h-[44.001px] relative rounded-[8px] shrink-0 w-full" data-name="Button - 02 Secondary">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[20px] py-[11px] relative size-full">
          <Content />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#f8f9fd] content-stretch flex flex-col gap-[8px] items-start px-[16px] py-[24px] relative rounded-[8px] shrink-0 w-[320px]" data-name=".Container">
      <div aria-hidden="true" className="absolute border-2 border-[#d8dce8] border-dashed inset-0 pointer-events-none rounded-[8px]" />
      <Button02Secondary />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#71747d] text-[14px] text-center w-full">Drop files here to upload...</p>
    </div>
  );
}

function ContainerState() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name=".Container state">
      <Container />
    </div>
  );
}

function TitleBoxContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Title + Box Container">
      <TitleSubtext />
      <ContainerState />
    </div>
  );
}

function FormUploader() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[320px]" data-name="Form - Uploader">
      <TitleBoxContainer />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[32px] pr-0 py-0 relative shrink-0">
      <FormUploader />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0" data-name="Frame">
      <Frame33 />
      <Frame34 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0">
      <Frame35 />
      <Frame10 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[632px]" data-name="Frame">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Background</p>
      <Frame36 />
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio7() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio7 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">1 Headline</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio8() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio8 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">With sub-headline</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio9() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio9 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">2 Headlines</p>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0" data-name="Frame">
      <Frame12 />
      <Frame13 />
      <Frame14 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[632px]" data-name="Frame">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Headline</p>
      <Frame15 />
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio10() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio10 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">None</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio11() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio11 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">1 Number</p>
    </div>
  );
}

function SelectionControlRadioSelectionControlRadio12() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="9.5" stroke="var(--stroke-0, #AEB2BE)" />
        </g>
      </svg>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio12 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">2 Numbers</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0" data-name="Frame">
      <Frame17 />
      <Frame18 />
      <Frame19 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[632px]" data-name="Frame">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Discount Amount</p>
      <Frame20 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-start pb-[24px] pt-[16px] px-[24px] relative shrink-0" data-name="Frame">
      <FormDropdown />
      <Frame5 />
      <Frame11 />
      <Frame16 />
      <Frame21 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[680px]" data-name="Frame">
      <Frame1 />
      <DsHorizontalLight />
      <Frame22 />
    </div>
  );
}

function DividerVertical() {
  return <div className="bg-[#d8dce8] self-stretch shrink-0 w-px" data-name="Divider - Vertical" />;
}

function Frame24() {
  return (
    <div className="relative shrink-0 w-full" data-name="Frame">
      <div className="content-stretch flex items-start pb-[16px] pt-[24px] px-[24px] relative w-full">
        <div className="flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#303135] text-[18px] text-nowrap">
          <p className="leading-[24px]">Preview</p>
        </div>
      </div>
    </div>
  );
}

function DsHorizontalLight1() {
  return <div className="bg-[#d8dce8] h-px shrink-0 w-full" data-name="DS-Horizontal/Light" />;
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

function Frame31() {
  return (
    <div className="bg-white h-[226px] relative rounded-[12px] shrink-0 w-[451px]">
      <div aria-hidden="true" className="absolute border border-[#dee2ee] border-solid inset-[-0.5px] pointer-events-none rounded-[12.5px]" />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Frame">
      <LanguageBar />
      <Frame31 />
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

function Frame32() {
  return (
    <div className="bg-white h-[226px] relative rounded-[12px] shrink-0 w-[451px]">
      <div aria-hidden="true" className="absolute border border-[#dee2ee] border-solid inset-[-0.5px] pointer-events-none rounded-[12.5px]" />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Frame">
      <LanguageBar1 />
      <Frame32 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="relative shrink-0 w-full" data-name="Frame">
      <div className="content-stretch flex flex-col gap-[24px] items-start pb-[24px] pt-[16px] px-[24px] relative w-full">
        <Frame25 />
        <Frame26 />
      </div>
    </div>
  );
}

function Frame28() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative rounded-tr-[12px] self-stretch shrink-0" data-name="Frame">
      <Frame24 />
      <DsHorizontalLight1 />
      <Frame27 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="bg-white content-stretch flex items-start relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-full" data-name="Frame">
      <Frame23 />
      <DividerVertical />
      <Frame28 />
    </div>
  );
}

function IconText1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Icon + Text">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#007bff] text-[18px] text-center text-nowrap">Cancel</p>
    </div>
  );
}

function Content1() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Content">
      <IconText1 />
      <div className="h-[0.001px] shrink-0 w-[72px]" data-name="Min width 120px" />
    </div>
  );
}

function Button02Secondary1() {
  return (
    <div className="bg-[#e7f2ff] content-stretch flex h-[52px] items-center justify-center px-[24px] py-[14px] relative rounded-[8px] shrink-0" data-name="Button - 02 Secondary">
      <Content1 />
    </div>
  );
}

function Component01Primary() {
  return (
    <div className="h-[52px] relative rounded-[8px] shrink-0 w-[140px]" data-name="01 Primary">
      <div className="absolute bg-[#d8dce8] inset-[0_-128.57%_0_0] rounded-[8px]" data-name="Button Shape" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] left-[calc(50%-9.5px)] not-italic text-[#aeb2be] text-[18px] text-center text-nowrap top-[calc(50%-12px)] translate-x-[-50%]">Next</p>
    </div>
  );
}

function MainCta() {
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-end relative shrink-0 w-full" data-name="Main CTA">
      <Button02Secondary1 />
      <Component01Primary />
    </div>
  );
}

function Frame30() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-[9.03%] right-[9.03%] top-[96px]" data-name="Frame">
      <Frame />
      <Frame29 />
      <MainCta />
    </div>
  );
}

export default function CreateNewBannerStep1Empty() {
  return (
    <div className="bg-[#fbfcfe] relative size-full" data-name="Create New Banner - Step 1 - Empty">
      <WithMenu />
      <Frame30 />
    </div>
  );
}