function Frame() {
  return (
    <div className="bg-[#f4f7fe] content-stretch flex items-start px-[12px] py-[10px] relative rounded-[6px] shrink-0">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#71747d] text-[14px] text-nowrap">Option 1</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white content-stretch flex items-start px-[12px] py-[10px] relative rounded-[6px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#007bff] text-[14px] text-nowrap">Option 2</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="[grid-area:1_/_1] content-stretch flex gap-[4px] items-start ml-0 mt-0 relative">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Frame2 />
    </div>
  );
}

export default function Switcher() {
  return (
    <div className="bg-[#f4f7fe] content-stretch flex flex-col items-start p-[4px] relative rounded-[8px] size-full" data-name="Switcher">
      <div aria-hidden="true" className="absolute border-[#d8dce8] border-[0.5px] border-solid inset-[-0.25px] pointer-events-none rounded-[8.25px]" />
      <Group />
    </div>
  );
}