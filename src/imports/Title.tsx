import svgPaths from "./svg-gczgbzzrga";

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

export default function Title() {
  return (
    <div className="bg-white content-stretch flex gap-[40px] items-center pl-[40px] pr-[24px] py-[24px] relative shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] size-full" data-name="Title">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#303135] text-[24px] text-nowrap">Banners</p>
      <BgN />
      <Component01Primary />
    </div>
  );
}