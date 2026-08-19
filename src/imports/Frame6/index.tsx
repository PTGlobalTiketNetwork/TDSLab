import imgPlaceholder1X1NoBackground1462 from "./5ed5cce11c3bd4bc32a429e9b749adfcf31802f5.png";
import { imgPlaceholder1X1NoBackground1461, imgPlaceholder1X1NoBackground1463 } from "./svg-1uwu8";
import svgPaths from "./svg-ttbk4qr324";

function PlaceHolderGeneral({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[400px]"} data-name="place_holder_general">
      <div className="absolute contents inset-0">
        <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[100%_100%]" style={{ maskImage: `url("${imgPlaceholder1X1NoBackground1461}")` }} data-name="Placeholder 1x1 no background-146 1">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgPlaceholder1X1NoBackground1462} />
        </div>
      </div>
    </div>
  );
}

function UnitPlaceholder({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[48px]"} data-name="Unit/_Placeholder">
      <svg className="absolute block inset-0 size-full" fill="none" height="48" preserveAspectRatio="none" viewBox="0 0 48 48" width="48">
        <circle cx="24" cy="24" fill="#F4F7FE" id="Ellipse 1" r="24" />
      </svg>
      <div className="absolute contents inset-0">
        <div className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[100%_100%]" style={{ maskImage: `url("${imgPlaceholder1X1NoBackground1463}")` }} data-name="Placeholder 1x1 no background-146 1">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgPlaceholder1X1NoBackground1462} />
        </div>
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col font-['Tiket_Odyssey_Display:Bold',sans-serif] gap-[8px] h-[80px] items-start justify-end leading-[0] not-italic relative shrink-0 text-[36px] w-full whitespace-nowrap" data-name="Text">
      <div className="flex flex-col justify-center relative shrink-0 text-[#fedd00]" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="leading-[36px]">Diskon</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-white" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="leading-[36px]">hingga</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-end justify-end relative self-stretch shrink-0" data-name="Frame">
      <Text />
    </div>
  );
}

function Number() {
  return (
    <div className="content-stretch flex h-[148px] items-start mr-[-24px] relative shrink-0" data-name="Number">
      <div className="[word-break:break-word] flex flex-col font-['Tiket_Odyssey_Display:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[168px] text-white tracking-[-8px] whitespace-nowrap" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="leading-[176px]">500</p>
      </div>
    </div>
  );
}

function UnitTnc() {
  return (
    <div className="h-full relative shrink-0" data-name="Unit + tnc">
      <div className="flex flex-col items-end justify-end size-full">
        <div className="content-stretch flex flex-col items-end justify-end pb-[8px] relative size-full">
          <UnitPlaceholder className="relative shrink-0 size-[48px]" />
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-start justify-center relative shrink-0 w-full" data-name="Frame">
      <Frame1 />
      <div className="relative self-stretch shrink-0" data-name="pt_number">
        <div className="flex flex-row items-end size-full">
          <div className="content-stretch flex items-end relative size-full">
            <Number />
            <UnitTnc />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" height="32" preserveAspectRatio="none" viewBox="0 0 32 32" width="32">
        <g id="Group">
          <path d={svgPaths.p3d507100} fill="#F5D84A" id="Vector" />
          <path d={svgPaths.p32892500} fill="white" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function ExtraDiscount() {
  return (
    <div className="content-stretch flex h-[40px] items-start relative shrink-0" data-name="Extra Discount">
      <div className="[word-break:break-word] flex flex-col font-['Tiket_Odyssey_Display:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[30px] text-white whitespace-nowrap" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="leading-[40px]">extra diskon hingga Rp300.000*</p>
      </div>
    </div>
  );
}

function DiscountArea() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Discount Area">
      <Group />
      <ExtraDiscount />
    </div>
  );
}

function DiscountPlaceholder() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Discount + Placeholder">
      <DiscountArea />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-center px-[32px] relative shrink-0 w-full">
      <p className="[word-break:break-word] font-['Tiket_Odyssey_Display:Bold',sans-serif] leading-[48px] min-w-full not-italic relative shrink-0 text-[48px] text-center text-white w-[min-content]" style={{ fontFeatureSettings: '"dlig" 1' }}>
        Hotel pilihan di Indonesia
      </p>
      <Frame />
      <DiscountPlaceholder />
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center justify-end px-[32px] relative shrink-0 w-full" data-name="Content">
      <Frame2 />
      <div className="bg-[#007cff] h-[84px] min-w-[224px] relative rounded-[16px] shrink-0 w-[354px]" data-name="Buttons - 01 Primary">
        <div className="flex flex-row items-center justify-center min-h-[inherit] min-w-[inherit] size-full">
          <div className="content-stretch flex gap-[16px] items-center justify-center min-h-[inherit] min-w-[inherit] px-[40px] py-[26px] relative size-full">
            <p className="[word-break:break-word] font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[32px] text-center text-white whitespace-nowrap" style={{ fontFeatureSettings: '"dlig" 1' }}>
              Primary button
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-center relative size-full">
      <Content />
      <div className="[word-break:break-word] flex flex-col font-['Tiket_Odyssey_Text:Regular',sans-serif] justify-end leading-[0] not-italic relative shrink-0 text-[12px] text-center text-white w-full" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="leading-[1.34]">{`*T&C apply`}</p>
      </div>
    </div>
  );
}