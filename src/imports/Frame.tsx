function SelectionControlRadioSelectionControlRadio() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Selection Control - RadioSelection Control - Radio">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Selection Control - RadioSelection Control - Radio">
          <circle cx="12" cy="12" fill="var(--fill-0, white)" id="radio" r="7" stroke="var(--stroke-0, #007BFF)" strokeWidth="6" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
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

function Frame1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Frame">
      <SelectionControlRadioSelectionControlRadio1 />
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Big Campaign</p>
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative size-full" data-name="Frame">
      <Frame />
      <Frame1 />
    </div>
  );
}