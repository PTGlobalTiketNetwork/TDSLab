import svgPaths from "./svg-giecde27v2";

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
      <p className="absolute font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38] left-0 not-italic text-[#71747d] text-[16px] text-nowrap top-0">Search</p>
    </div>
  );
}

function SearchBoxGrey() {
  return (
    <div className="bg-[#f4f7fe] relative rounded-[100px] shrink-0 w-full" data-name="Search box - Grey">
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

function SearchBox() {
  return (
    <div className="content-stretch flex flex-col items-start px-0 py-[12px] relative shrink-0 w-full" data-name="Search box">
      <SearchBoxGrey />
    </div>
  );
}

function CountryCode() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Country + Code">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Hotel</p>
    </div>
  );
}

function TdsIcOvalCheck() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="tds_ic_oval_check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="tds_ic_oval_check">
          <g id="vector">
            <path clipRule="evenodd" d={svgPaths.p2096e280} fill="var(--fill-0, #007CFF)" fillRule="evenodd" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ListItem() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name=".List item">
      <div className="content-stretch flex gap-[12px] items-start p-[12px] relative w-full">
        <CountryCode />
        <TdsIcOvalCheck />
      </div>
    </div>
  );
}

function CountryCode1() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Country + Code">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Transport</p>
    </div>
  );
}

function ListItem1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name=".List item">
      <div className="content-stretch flex gap-[12px] items-start p-[12px] relative w-full">
        <CountryCode1 />
      </div>
    </div>
  );
}

function CountryCode2() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Country + Code">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">Event</p>
    </div>
  );
}

function ListItem2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name=".List item">
      <div className="content-stretch flex gap-[12px] items-start p-[12px] relative w-full">
        <CountryCode2 />
      </div>
    </div>
  );
}

function CountryCode3() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Country + Code">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">To Do</p>
    </div>
  );
}

function ListItem3() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name=".List item">
      <div className="content-stretch flex gap-[12px] items-start p-[12px] relative w-full">
        <CountryCode3 />
      </div>
    </div>
  );
}

function CountryCode4() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Country + Code">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[#303135] text-[16px] text-nowrap">+ Add New</p>
    </div>
  );
}

function ListItem4() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name=".List item">
      <div className="content-stretch flex gap-[12px] items-start p-[12px] relative w-full">
        <CountryCode4 />
      </div>
    </div>
  );
}

function Overlay() {
  return <div className="absolute bg-gradient-to-b bottom-[-186px] from-[rgba(255,255,255,0)] h-[72px] left-0 right-0 to-white" data-name="Overlay" />;
}

function ScrollIndicator() {
  return <div className="absolute bg-[#aeb2be] h-[60px] right-[4px] rounded-[4px] top-[calc(50%-55px)] translate-y-[-50%] w-[8px]" data-name="Scroll Indicator" />;
}

function ScrollIndicator1() {
  return (
    <div className="absolute contents left-0 top-[72px]" data-name="Scroll Indicator">
      <Overlay />
      <ScrollIndicator />
    </div>
  );
}

function TotalMenuScrolling() {
  return (
    <div className="bg-white h-[314px] relative shrink-0 w-full" data-name="Total Menu / Scrolling">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start px-[12px] py-[8px] relative size-full">
          <SearchBox />
          <ListItem />
          <ListItem1 />
          <ListItem2 />
          <ListItem3 />
          <ListItem4 />
          <ScrollIndicator1 />
        </div>
      </div>
    </div>
  );
}

export default function Dropdown() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] size-full" data-name="Dropdown">
      <TotalMenuScrolling />
    </div>
  );
}