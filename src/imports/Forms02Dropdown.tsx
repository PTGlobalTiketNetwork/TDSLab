import svgPaths from "./svg-h6rpw0zaoo";

function Placeholder() {
  return (
    <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px overflow-clip relative shrink-0" data-name="Placeholder">
      <p className="basis-0 font-['Tiket_Odyssey_Text:Regular',sans-serif] grow leading-[1.43] min-h-px min-w-px not-italic relative shrink-0 text-[#71747d] text-[14px]">Placeholder</p>
    </div>
  );
}

function TdsIcChevronDown() {
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

function Box() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Box">
      <div aria-hidden="true" className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center p-[16px] relative w-full">
          <Placeholder />
          <TdsIcChevronDown />
        </div>
      </div>
    </div>
  );
}

export default function Forms02Dropdown() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative size-full" data-name="Forms - 02 Dropdown">
      <Box />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.34] not-italic relative shrink-0 text-[#71747d] text-[12px] w-full">Helper text has no maximum line limit and no truncation.</p>
    </div>
  );
}