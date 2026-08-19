import svgPaths from "./svg-2akxad69hc";

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

export default function Filter() {
  return (
    <div className="content-stretch flex gap-[140px] items-start relative size-full" data-name="Filter">
      <Left />
    </div>
  );
}