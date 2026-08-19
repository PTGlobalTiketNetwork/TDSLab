import svgPaths from "./svg-quh4u2q8jl";

function SelectionControlCheckbox() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[24px]" data-name=".Selection Control - Checkbox">
      <div className="absolute bg-white border border-[#aeb2be] border-solid inset-[8.33%] rounded-[2px]" data-name="box" />
    </div>
  );
}

function Checkbox() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name=".Checkbox">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[12px] relative w-full">
          <SelectionControlCheckbox />
          <p className="basis-0 font-['Tiket_Odyssey_Text:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#303135] text-[14px]">General</p>
        </div>
      </div>
    </div>
  );
}

function SelectionControlCheckbox1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - Checkbox">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - Checkbox">
          <rect fill="var(--fill-0, #007BFF)" height="19" id="box" rx="1.5" stroke="var(--stroke-0, #007BFF)" width="19" x="2.5" y="2.5" />
          <path clipRule="evenodd" d={svgPaths.pd617e00} fill="var(--fill-0, white)" fillRule="evenodd" id="shape" />
        </g>
      </svg>
    </div>
  );
}

function Checkbox1() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name=".Checkbox">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[12px] relative w-full">
          <SelectionControlCheckbox1 />
          <p className="basis-0 font-['Tiket_Odyssey_Text:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#303135] text-[14px]">Accomodation</p>
        </div>
      </div>
    </div>
  );
}

function SelectionControlCheckbox2() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[24px]" data-name=".Selection Control - Checkbox">
      <div className="absolute bg-white border border-[#aeb2be] border-solid inset-[8.33%] rounded-[2px]" data-name="box" />
    </div>
  );
}

function Checkbox2() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name=".Checkbox">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[12px] relative w-full">
          <SelectionControlCheckbox2 />
          <p className="basis-0 font-['Tiket_Odyssey_Text:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#303135] text-[14px]">ToDos</p>
        </div>
      </div>
    </div>
  );
}

function SelectionControlCheckbox3() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[24px]" data-name=".Selection Control - Checkbox">
      <div className="absolute bg-white border border-[#aeb2be] border-solid inset-[8.33%] rounded-[2px]" data-name="box" />
    </div>
  );
}

function Checkbox3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name=".Checkbox">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[12px] relative w-full">
          <SelectionControlCheckbox3 />
          <p className="basis-0 font-['Tiket_Odyssey_Text:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#303135] text-[14px]">Transports</p>
        </div>
      </div>
    </div>
  );
}

function SelectionControlCheckbox4() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[24px]" data-name=".Selection Control - Checkbox">
      <div className="absolute bg-white border border-[#aeb2be] border-solid inset-[8.33%] rounded-[2px]" data-name="box" />
    </div>
  );
}

function Checkbox4() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name=".Checkbox">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[12px] relative w-full">
          <SelectionControlCheckbox4 />
          <p className="basis-0 font-['Tiket_Odyssey_Text:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#303135] text-[14px]">Others</p>
        </div>
      </div>
    </div>
  );
}

function TotalMenuScrolling() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Total Menu / Scrolling">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start px-[12px] py-[8px] relative w-full">
          <Checkbox />
          <Checkbox1 />
          <Checkbox2 />
          <Checkbox3 />
          <Checkbox4 />
        </div>
      </div>
    </div>
  );
}

function DropdownListSelectionSingleColumn() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-full" data-name=".Dropdown - List Selection Single Column">
      <TotalMenuScrolling />
    </div>
  );
}

export default function DropdownFilter() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Dropdown Filter">
      <DropdownListSelectionSingleColumn />
    </div>
  );
}