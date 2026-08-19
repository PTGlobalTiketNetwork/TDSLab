import imgImage21 from "./c593b610d3877a5faf067379a77363d554217a35.png";
import imgPlaceholder1X1NoBackground1462 from "./5ed5cce11c3bd4bc32a429e9b749adfcf31802f5.png";
import { imgPlaceholder1X1NoBackground1461, imgPlaceholder1X1NoBackground1463 } from "./svg-n2x7p";
import svgPaths from "./svg-b029fjeu6h";
import imgPlaceholderNoBg1541 from "./e570639a74a6aebff827307a45d34ec43088b201.png";

function Image({ className }: { className?: string }) {
  return (
    <div className={className || "h-[180px] relative w-[360px]"} data-name="Image - 2:1">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage21} />
    </div>
  );
}

function VariantPaymentPlaceholder({ className }: { className?: string }) {
  return (
    <div className={className || "h-[40px] relative w-[80px]"} data-name="Variant Payment/Placeholder">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage21} />
    </div>
  );
}

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

function Ratio() {
  return (
    <div className="absolute bottom-[16px] content-stretch flex flex-col items-center justify-center right-[16px]" data-name="Ratio">
      <p className="[word-break:break-word] font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[1.19] not-italic relative shrink-0 text-[#71747d] text-[64px] text-center w-full" style={{ fontFeatureSettings: '"dlig" 1' }}>
        1:1
      </p>
    </div>
  );
}

function GradientGroup() {
  return (
    <div className="absolute bottom-[-4px] contents left-[-4px] right-[-4px]" data-name="Gradient Group">
      <div className="absolute bg-gradient-to-b bottom-0 from-[rgba(0,0,0,0)] h-[640px] left-0 right-0 to-black" />
      <div className="absolute bg-gradient-to-b bottom-0 from-[rgba(0,0,0,0)] h-[640px] left-0 right-0 to-black" />
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
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col items-end justify-center pb-[8px] relative size-full">
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
    <div className="content-stretch flex flex-col gap-[20px] items-center relative shrink-0 w-full">
      <p className="[word-break:break-word] font-['Tiket_Odyssey_Display:Bold',sans-serif] leading-[48px] min-w-full not-italic relative shrink-0 text-[48px] text-white w-[min-content]" style={{ fontFeatureSettings: '"dlig" 1' }}>
        Hotel pilihan di Indonesia
      </p>
      <Frame />
      <DiscountPlaceholder />
    </div>
  );
}

function Content() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[40px] items-center justify-end left-1/2 top-[476px] w-[585.478px]" data-name="Content">
      <Frame2 />
      <div className="bg-[#007cff] h-[84px] min-w-[224px] relative rounded-[8px] shrink-0 w-[354px]" data-name="Buttons - 01 Primary">
        <div className="flex flex-row items-center justify-center min-h-[inherit] min-w-[inherit] size-full">
          <div className="content-stretch flex gap-[16px] items-center justify-center min-h-[inherit] min-w-[inherit] px-[40px] py-[26px] relative size-full">
            <div className="relative shrink-0 size-[40px]" data-name="tds_ic_placeholder">
              <div className="absolute bg-white inset-[8.33%] rounded-[6px]" data-name="vector" />
            </div>
            <p className="[word-break:break-word] font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[1.38] not-italic relative shrink-0 text-[32px] text-center text-white whitespace-nowrap" style={{ fontFeatureSettings: '"dlig" 1' }}>
              Primary button
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Component03PortraitEn() {
  return (
    <div className="bg-[#138f92] border-4 border-solid border-white relative size-full" data-name="03 Portrait/EN">
      <div className="absolute bg-[#eef0f7] left-[-4px] size-[720px] top-[-4px]" data-name="Image Placeholder - 1:1">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center justify-center relative size-full">
            <div className="overflow-clip relative shrink-0 size-[640px]" data-name="Image">
              <div className="absolute inset-[-34.74%]" data-name="placeholder_no_bg-154 1">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img alt="" className="absolute left-[20.5%] max-w-none size-[59.01%] top-[20.5%]" src={imgPlaceholderNoBg1541} />
                </div>
              </div>
            </div>
            <Ratio />
          </div>
        </div>
      </div>
      <GradientGroup />
      <div className="-translate-y-full [word-break:break-word] absolute flex flex-col font-['Tiket_Odyssey_Text:Semi_Bold',sans-serif] justify-end leading-[0] left-[calc(50%-46px)] not-italic text-[12px] text-white top-[924px] whitespace-nowrap" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid leading-[1.34] line-through">{`*T&C apply`}</p>
      </div>
      <Content />
      <div className="absolute bg-white right-[-2px] rounded-bl-[40px] rounded-tl-[40px] top-[36px]" data-name="pt_payment_airlines_area">
        <div className="flex flex-row items-center justify-end size-full">
          <div className="content-stretch flex gap-[20px] items-center justify-end px-[24px] py-[8px] relative size-full">
            <div className="h-[50px] relative shrink-0 w-[100px]" data-name="pt_logo/placeholder">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage21} />
            </div>
            <div className="h-[50px] relative shrink-0 w-[100px]" data-name="pt_logo/placeholder">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage21} />
            </div>
          </div>
        </div>
      </div>
      <VariantPaymentPlaceholder className="absolute inset-[calc(4.17%-3.67px)_calc(74.58%+1.97px)_calc(88.33%+3.07px)_calc(5.42%-3.57px)]" />
    </div>
  );
}