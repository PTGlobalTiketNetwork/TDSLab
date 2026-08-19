function Text() {
  return (
    <div className="h-[16px] relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-[19.859px]" data-name="Text">
      <p className="absolute font-['Tiket_Odyssey_Display',sans-serif] font-bold leading-[16px] left-0 not-italic text-[16px] text-nowrap text-white top-0">Rp</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[22px] relative shrink-0 w-[82.664px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Display',sans-serif] font-bold leading-[22px] left-[83px] not-italic text-[20px] text-nowrap text-right text-white top-[-0.5px] translate-x-[-100%]">Discount</p>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[47.406px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Display',sans-serif] font-bold leading-[22px] left-[48px] not-italic text-[20px] text-nowrap text-right text-white top-[-0.5px] translate-x-[-100%]">up to</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col h-[44px] items-end relative shrink-0 w-full" data-name="Container">
      <Text1 />
      <Text2 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-full items-end justify-center relative shrink-0 w-[83.258px]">
      <Text />
      <Container />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex items-center mr-[-12px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Tiket_Odyssey_Display',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[96px] text-white tracking-[-2.4px] w-[105px]">
        <p className="leading-[70px]">50</p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[18px] relative shrink-0 w-[11.883px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[18px] left-0 not-italic text-[#0064d2] text-[18px] text-nowrap top-[-1px]">K</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center mr-[-12px] pl-0 pr-[0.008px] py-0 relative rounded-[1.67772e+07px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 size-[36px]" data-name="Container">
      <Text3 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-end justify-center pl-0 pr-[12px] py-0 relative shrink-0">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
      <div className="flex flex-row items-center self-stretch">
        <Frame />
      </div>
      <Frame2 />
    </div>
  );
}

export default function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Container">
      <Frame1 />
    </div>
  );
}