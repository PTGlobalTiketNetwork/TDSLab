import imgPlaceholder1X1NoBackground1462 from "./5ed5cce11c3bd4bc32a429e9b749adfcf31802f5.png";
import { imgPlaceholder1X1NoBackground1461, imgPlaceholder1X1NoBackground1463 } from "./svg-s79jm";

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

function Frame() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <div className="[word-break:break-word] flex flex-col font-['Tiket_Odyssey_Display:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#fedd00] text-[40px] w-full" style={{ fontFeatureSettings: '"dlig" 1' }}>
        <p className="leading-[36px]">Discount</p>
      </div>
    </div>
  );
}

function UnitTnc() {
  return (
    <div className="flex flex-row items-center self-stretch">
      <div className="content-stretch flex flex-col h-full items-end pb-[8px] relative shrink-0" data-name="Unit + tnc">
        <div className="[word-break:break-word] flex flex-col font-['Tiket_Odyssey_Display:Bold',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[24px] text-center text-white w-[min-content]" style={{ fontFeatureSettings: '"dlig" 1' }}>
          <p className="leading-[28px]">Rp</p>
        </div>
      </div>
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

function UnitTnc1() {
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

function Frame1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <UnitTnc />
      <div className="flex flex-row items-center self-stretch">
        <div className="h-full relative shrink-0" data-name="pt_number">
          <div className="flex flex-row items-end size-full">
            <div className="content-stretch flex items-end relative size-full">
              <Number />
              <UnitTnc1 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Component1Benefit() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative size-full" data-name="1 Benefit">
      <Frame />
      <Frame1 />
    </div>
  );
}