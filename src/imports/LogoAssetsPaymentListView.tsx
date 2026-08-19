import svgPaths from "./svg-5ettuqfcar";
import imgPtLogoPayment from "figma:asset/efe98099a0aa97c1aa64e286bc82e633cc9aed22.png";

function VerticalLight() {
  return <div className="absolute bg-[#d8dce8] inset-[0_99.77%_0_0]" data-name="Vertical/Light" />;
}

function PtLogoPayment() {
  return (
    <div className="h-[180px] relative rounded-[12px] shrink-0 w-[360px]" data-name="pt_logo/payment">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        <div className="absolute bg-repeat bg-size-[25.600000381469727px_25.600000381469727px] bg-top-left inset-0 opacity-10 rounded-[12px]" style={{ backgroundImage: `url('${imgPtLogoPayment}')` }} />
        <div className="absolute bg-[rgba(0,0,0,0.05)] inset-0 rounded-[12px]" />
      </div>
      <div className="absolute inset-[20%_0_17.5%_1.25%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 355.5 112.5">
          <g id="Vector">
            <path d={svgPaths.p34893700} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p2f0be3c0} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p5f581a0} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p57bc340} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p17229580} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p29c87600} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p2bbdba00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p37689e00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p3c36a380} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p32751730} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p21822980} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p21b9e380} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.pf4a8f00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p305c0180} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p20516f00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p2b6fed80} fill="var(--fill-0, #0660A5)" />
          </g>
        </svg>
      </div>
    </div>
  );
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

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center p-[4px] relative shrink-0 w-[64px]" data-name="Frame">
      <TdsIcDelete />
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-center text-nowrap">Delete</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#f4f7fe] content-stretch flex gap-[16px] items-start px-[16px] py-[8px] relative rounded-[56px] shrink-0" data-name="Frame">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="Frame">
      <PtLogoPayment />
      <Frame2 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center text-nowrap">BCA</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] gap-[8px] items-start leading-[20px] not-italic relative self-stretch shrink-0 text-[#71747d] text-[14px] text-nowrap w-[72px]">
      <p className="relative shrink-0">Ratio</p>
      <p className="relative shrink-0">Dimension</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] gap-[8px] grow items-start leading-[20px] min-h-px min-w-px not-italic relative self-stretch shrink-0 text-[#303135] text-[14px] text-nowrap">
      <p className="relative shrink-0">2:1</p>
      <p className="relative shrink-0">200*100</p>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] gap-[8px] items-start leading-[20px] not-italic relative self-stretch shrink-0 text-[#71747d] text-[14px] text-nowrap w-[72px]">
      <p className="relative shrink-0">File size</p>
      <p className="relative shrink-0">Added on</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Tiket_Odyssey_Text:Bold',sans-serif] gap-[8px] grow items-start leading-[20px] min-h-px min-w-px not-italic relative self-stretch shrink-0 text-[#303135] text-[14px] text-nowrap">
      <p className="relative shrink-0">128 kb</p>
      <p className="relative shrink-0">20 Oct 2022</p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
      <Frame20 />
      <Frame23 />
      <Frame24 />
      <Frame25 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[360px]">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#71747d] text-[16px] text-center text-nowrap">Asset Info</p>
      <Frame22 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start pb-[32px] pt-[132px] px-[32px] right-0 top-0 w-[431px]" data-name="Frame">
      <Frame3 />
      <Frame18 />
      <Frame19 />
    </div>
  );
}

function Details() {
  return (
    <div className="absolute bg-white h-[1024px] left-[1008px] top-0 w-[432px]" data-name="Details">
      <VerticalLight />
      <Frame4 />
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
      <p className="absolute font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] left-0 not-italic text-[#71747d] text-[16px] text-nowrap top-0">Search asset by name</p>
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
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[18px] text-center text-nowrap text-white">Add Asset</p>
    </div>
  );
}

function Title() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[40px] items-center left-[268px] pl-[40px] pr-[24px] py-[24px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] top-0 w-[1172px]" data-name="Title">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#303135] text-[24px] text-nowrap">Logo Asset</p>
      <BgN />
      <Component01Primary />
    </div>
  );
}

function PtLogoPayment1() {
  return (
    <div className="h-[48px] relative shrink-0 w-[96px]" data-name="pt_logo/payment">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 96 48">
        <g id="pt_logo/payment">
          <g id="Vector">
            <path d={svgPaths.p3bf9e00} fill="#929498" />
            <path d={svgPaths.pf553100} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p2d472500} fill="#EF9420" />
            <path d={svgPaths.p1e747d40} fill="#FFC20D" />
            <path d={svgPaths.p3ece5680} fill="#E97024" />
            <path d={svgPaths.p703b900} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p31f8c7f0} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p19ac1d40} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p2e823f0} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p3280e400} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p2cfb8c00} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p14338e00} fill="var(--fill-0, #636568)" />
            <path d={svgPaths.p390d3100} fill="var(--fill-0, #636568)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TitleSubtext() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] min-w-full not-italic relative shrink-0 text-[#303135] text-[18px] w-[min-content]">BCA</p>
    </div>
  );
}

function Content() {
  return (
    <div className="basis-0 bg-white content-stretch flex gap-[20px] grow items-center min-h-px min-w-px overflow-clip p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[692px]" data-name="Content">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center w-[26px]">01</p>
      <PtLogoPayment1 />
      <TitleSubtext />
    </div>
  );
}

function PtLogoPayment2() {
  return (
    <div className="h-[48px] relative shrink-0 w-[96px]" data-name="pt_logo/payment">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute bg-repeat bg-size-[9.600000381469727px_9.600000381469727px] bg-top-left inset-0 opacity-10" style={{ backgroundImage: `url('${imgPtLogoPayment}')` }} />
        <div className="absolute bg-[rgba(0,0,0,0.05)] inset-0" />
      </div>
      <div className="absolute inset-[20%_0_17.5%_1.25%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 94.8 30">
          <g id="Vector">
            <path d={svgPaths.p130b8280} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.pe476e80} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p261cfd00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p2713bb00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p23158a80} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p1cf29900} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p1ef69280} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p202ab200} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p1e152000} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p1f856080} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p4381400} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p2347fd00} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p1c9df100} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.pfc8d580} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p90fa050} fill="var(--fill-0, #0660A5)" />
            <path d={svgPaths.p1ea2e200} fill="var(--fill-0, #0660A5)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function TitleSubtext1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] min-w-full not-italic relative shrink-0 text-[#303135] text-[18px] w-[min-content]">BCA</p>
    </div>
  );
}

function Content1() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-[692px]" data-name="Content">
      <div className="content-stretch flex gap-[20px] items-center overflow-clip p-[16px] relative rounded-[inherit] w-full">
        <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center w-[26px]">01</p>
        <PtLogoPayment2 />
        <TitleSubtext1 />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#007bff] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]" />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[16.67%_16.67%_34.65%_0]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 80.0003 23.3683">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p1f106400} fill="var(--fill-0, #005F7A)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p1f106400} fill="var(--fill-0, #005F7A)" fillRule="evenodd" id="Vector_2" />
          <path clipRule="evenodd" d={svgPaths.p23c34370} fill="var(--fill-0, #005F7A)" fillRule="evenodd" id="Vector_3" />
          <path clipRule="evenodd" d={svgPaths.p23c34370} fill="var(--fill-0, #005F7A)" fillRule="evenodd" id="Vector_4" />
          <path clipRule="evenodd" d={svgPaths.p1b72a900} fill="var(--fill-0, #005F7A)" fillRule="evenodd" id="Vector_5" />
          <path clipRule="evenodd" d={svgPaths.p1b72a900} fill="var(--fill-0, #005F7A)" fillRule="evenodd" id="Vector_6" />
          <path d={svgPaths.pd00d400} fill="var(--fill-0, #E97A2A)" id="Vector_7" />
          <g id="Vector_8"></g>
          <path clipRule="evenodd" d={svgPaths.p3a2ea680} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector_9" />
          <g id="Vector_10"></g>
        </g>
      </svg>
    </div>
  );
}

function PtLogoPayment3() {
  return (
    <div className="h-[48px] relative shrink-0 w-[96px]" data-name="pt_logo/payment">
      <Group />
    </div>
  );
}

function TitleSubtext2() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] min-w-full not-italic relative shrink-0 text-[#303135] text-[18px] w-[min-content]">BNI</p>
    </div>
  );
}

function Content2() {
  return (
    <div className="bg-white content-stretch flex gap-[20px] items-center overflow-clip p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[692px]" data-name="Content">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center w-[26px]">01</p>
      <PtLogoPayment3 />
      <TitleSubtext2 />
    </div>
  );
}

function PtLogoPayment4() {
  return (
    <div className="h-[48px] relative shrink-0 w-[96px]" data-name="pt_logo/payment">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 96.0008 48">
        <g id="pt_logo/payment">
          <g id="Vector">
            <path d={svgPaths.p124e9d00} fill="white" />
            <path d={svgPaths.p10dcfdf2} fill="#D54633" />
            <path d={svgPaths.p3967c500} fill="#D54633" />
            <path d={svgPaths.p2726600} fill="#D54633" />
            <path d={svgPaths.pfeced00} fill="#D54633" />
            <path d={svgPaths.p27f93600} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.pe7051b0} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p3fc67d80} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p233ec400} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p2d2ee880} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p13d3d680} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p6631000} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p32487b80} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p222ef580} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p28d94d80} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p1e8c0be0} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p19633f0} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p19276840} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.pc610600} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p29aa3600} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p45d8800} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p1a3da000} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p7401980} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p14b8e880} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p23747280} fill="var(--fill-0, #221F20)" />
            <path d={svgPaths.p22bf6100} fill="var(--fill-0, #221F20)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TitleSubtext3() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] min-w-full not-italic relative shrink-0 text-[#303135] text-[18px] w-[min-content]">HSBC</p>
    </div>
  );
}

function Content3() {
  return (
    <div className="bg-white content-stretch flex gap-[20px] items-center overflow-clip p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[692px]" data-name="Content">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] text-center w-[26px]">01</p>
      <PtLogoPayment4 />
      <TitleSubtext3 />
    </div>
  );
}

function TdsIcChevronLeft() {
  return (
    <div className="absolute inset-[0_3.85%]" data-name="tds_ic_chevron_left">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tds_ic_chevron_left">
          <path d={svgPaths.p64152c0} fill="var(--fill-0, #D8DCE8)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function IconPrevious() {
  return (
    <div className="h-[24px] relative shrink-0 w-[26px]" data-name="Icon - previous">
      <TdsIcChevronLeft />
    </div>
  );
}

function PaginationPageNumber() {
  return (
    <div className="h-[24px] relative shrink-0 w-[26px]" data-name="Pagination / page number">
      <div className="absolute bg-[#e7f2ff] inset-[0_7.69%_0_0] rounded-[100px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_19.23%_8.33%_11.54%] leading-[20px] not-italic text-[#007bff] text-[14px] text-center">1</p>
    </div>
  );
}

function PaginationPageNumber1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">2</p>
    </div>
  );
}

function PaginationPageNumber2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">3</p>
    </div>
  );
}

function PaginationPageNumber3() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">4</p>
    </div>
  );
}

function PaginationPageNumber4() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">5</p>
    </div>
  );
}

function PaginationPageNumber5() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">6</p>
    </div>
  );
}

function PaginationPageNumber6() {
  return (
    <div className="h-[24px] relative shrink-0 w-[26px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">...</p>
    </div>
  );
}

function PaginationPageNumber7() {
  return (
    <div className="h-[24px] relative shrink-0 w-[26px]" data-name="Pagination / page number">
      <div className="absolute inset-0 rounded-[4px]" />
      <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] inset-[8.33%_15.38%] leading-[20px] not-italic text-[#71747d] text-[14px] text-center">20</p>
    </div>
  );
}

function TdsIcChevronRight() {
  return (
    <div className="absolute inset-[0_3.85%]" data-name="tds_ic_chevron_right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="tds_ic_chevron_right">
          <path d={svgPaths.p37aaca80} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function IconNext() {
  return (
    <div className="h-[24px] relative shrink-0 w-[26px]" data-name="Icon - Next">
      <TdsIcChevronRight />
    </div>
  );
}

function PaginationFirstPage() {
  return (
    <div className="content-stretch flex gap-[4px] items-start relative shrink-0" data-name="Pagination / First Page">
      <IconPrevious />
      <PaginationPageNumber />
      <PaginationPageNumber1 />
      <PaginationPageNumber2 />
      <PaginationPageNumber3 />
      <PaginationPageNumber4 />
      <PaginationPageNumber5 />
      <PaginationPageNumber6 />
      <PaginationPageNumber7 />
      <IconNext />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex h-[32px] items-center justify-between relative shrink-0 w-full">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#71747d] text-[12px] text-nowrap">Showing 1-10 of 500</p>
      <PaginationFirstPage />
    </div>
  );
}

function Frame21() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-[292px] top-[180px]">
      <Content />
      <Content1 />
      <Content2 />
      <Content3 />
      <Frame26 />
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
          <path d={svgPaths.pdb35e00} fill="var(--fill-0, #FEDD00)" id="Vector_2" />
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
            <g filter="url(#filter0_d_2031_7119)" id="Ellipse 76">
              <circle cx="24" cy="22" fill="var(--fill-0, white)" r="16" />
            </g>
            <g id="ic-chevron-left-navigation">
              <path d={svgPaths.p3078ca00} fill="var(--fill-0, #4D4F56)" id="Mask" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="48" id="filter0_d_2031_7119" width="48" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2031_7119" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_2031_7119" mode="normal" result="shape" />
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
          <path d={svgPaths.p1d4fb80} fill="var(--fill-0, #A3CFFF)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <TdsIcHomeOff />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Home</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[8px] py-[10px] relative shrink-0 w-[240px]">
      <Frame14 />
    </div>
  );
}

function ItemExpandSidebar() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame6 />
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

function TdsIcChevronDown2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_chevron_down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_chevron_down">
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <IconEmptyIcon />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Banners</p>
      <TdsIcChevronDown2 />
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

function ItemExpandSidebar1() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame8 />
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
        <g id="tds_ic_chevron_down">
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <IconEmptyIcon1 />
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] w-[176px]">Logo Assets</p>
      <IcChevronDownNavigation />
    </div>
  );
}

function Frame9() {
  return (
    <div className="[grid-area:1_/_1] bg-[rgba(17,0,0,0)] content-stretch flex flex-col items-start ml-[28px] mt-0 overflow-clip pl-0 pr-[8px] py-[10px] relative w-[240px]">
      <Frame16 />
    </div>
  );
}

function Group1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Frame9 />
      <div className="[grid-area:1_/_1] bg-[#007bff] h-[40px] ml-0 mt-0 w-[4px]" />
    </div>
  );
}

function ItemExpandSidebar2() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shrink-0" data-name="Item Expand Sidebar">
      <Group1 />
    </div>
  );
}

function IconText() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Icon + Text">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] w-[176px]">Payment Parner</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText />
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-[#e7f2ff] content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative rounded-bl-[8px] rounded-tl-[8px] shrink-0">
      <Frame7 />
    </div>
  );
}

function ItemExpandSidebar3() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame13 />
    </div>
  );
}

function IconText1() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Icon + Text">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Other Partner</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText1 />
    </div>
  );
}

function ItemExpandSidebar4() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[56px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame10 />
    </div>
  );
}

function IconText2() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Icon + Text">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Campaign</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] relative shrink-0">
      <IconText2 />
    </div>
  );
}

function ItemExpandSidebar5() {
  return (
    <div className="bg-white content-stretch flex flex-col items-end justify-center pl-[56px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame11 />
    </div>
  );
}

function TdsIcSetting() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_setting">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_setting">
          <path clipRule="evenodd" d={svgPaths.p286f0600} fill="var(--fill-0, #A3CFFF)" fillRule="evenodd" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function IcChevronDownNavigation1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="ic-chevron-down-navigation">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_chevron_down">
          <path d={svgPaths.p3504a860} fill="var(--fill-0, #4D4F56)" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <TdsIcSetting />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#303135] text-[14px] w-[176px]">Settings</p>
      <IcChevronDownNavigation1 />
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

function ItemExpandSidebar6() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pl-[28px] pr-0 py-0 relative shrink-0" data-name="Item Expand Sidebar">
      <Frame12 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] items-start left-0 top-[121px]" data-name="Frame">
      <ItemExpandSidebar />
      <ItemExpandSidebar1 />
      <ItemExpandSidebar2 />
      <ItemExpandSidebar3 />
      <ItemExpandSidebar4 />
      <ItemExpandSidebar5 />
      <ItemExpandSidebar6 />
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
          <mask height="6" id="mask0_2031_7108" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }} width="11" x="5" y="7">
            <path d={svgPaths.p3504a860} fill="var(--fill-0, white)" id="Mask_2" />
          </mask>
          <g mask="url(#mask0_2031_7108)">
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

function ItemExpandSidebar7() {
  return (
    <div className="absolute bg-white inset-[0_81.39%_0_0] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]" data-name="Item Expand Sidebar">
      <LogoTiketHorizontal />
      <ItemIcon />
      <HorizontalLight />
      <Frame5 />
      <RightAction />
    </div>
  );
}

export default function LogoAssetsPaymentListView() {
  return (
    <div className="bg-[#f8f9fd] relative size-full" data-name="Logo Assets - Payment - List view">
      <Details />
      <Title />
      <Frame21 />
      <Filter />
      <ItemExpandSidebar7 />
    </div>
  );
}