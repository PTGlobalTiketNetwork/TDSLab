import imgPtDailyPromo101 from "figma:asset/c40c4f4e209437a007039a6d36e30c055e0959d0.png";
import imgPtDailyPromo102 from "figma:asset/dbbf9573801a0f321b44f388b9d3127169bed17f.png";
import imgPtDailyPromo103 from "figma:asset/f10df88a7dca2b1b76d5f9750c38136ffa2e7128.png";
import imgPtDailyPromo104 from "figma:asset/3c3be37181695898c80147511eb974467207b0e9.png";

function TitleSubtext() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">OTW Hotel Promo</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0">
      <TitleSubtext />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shrink-0 w-[336px]" data-name="Content">
      <div aria-hidden="true" className="absolute border-2 border-[#007bff] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]" />
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo101} />
      </div>
      <Frame1 />
    </div>
  );
}

function TitleSubtext1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">Car rental promo 1</p>
    </div>
  );
}

function WithTag() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="With Tag">
      <TitleSubtext1 />
    </div>
  );
}

function Content1() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[336px]" data-name="Content">
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo102} />
      </div>
      <WithTag />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0">
      <Content />
      <Content1 />
    </div>
  );
}

function TitleSubtext2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">Flight promo Sriwijaya, NAM air</p>
    </div>
  );
}

function WithTag1() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="With Tag">
      <TitleSubtext2 />
    </div>
  );
}

function Content2() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[336px]" data-name="Content">
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo103} />
      </div>
      <WithTag1 />
    </div>
  );
}

function TitleSubtext3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[304px]" data-name="Title + Subtext">
      <p className="font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#303135] text-[18px] w-full">First time user</p>
    </div>
  );
}

function WithTag2() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="With Tag">
      <TitleSubtext3 />
    </div>
  );
}

function Content3() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[20px] items-center p-[16px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] shrink-0 w-[336px]" data-name="Content">
      <div className="h-[152px] relative rounded-[12px] shrink-0 w-[304px]" data-name="pt_daily_promo (10) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgPtDailyPromo104} />
      </div>
      <WithTag2 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0">
      <Content2 />
      <Content3 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative size-full">
      <Frame2 />
      <Frame3 />
    </div>
  );
}