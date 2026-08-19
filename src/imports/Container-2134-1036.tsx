import imgImageBackground from "figma:asset/ba2fdd0a2a4ec71faa6ff19bf31b59bbb99e82de.png";
import imgImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlinesC93Fe71B41F047DcA02BDccd8F4C810CPng from "figma:asset/ca90c531405d98ba2c79932010b9cb7618bec18a.png";
import imgImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlines6F83B840F328420393124C7E09226076Png from "figma:asset/2e902cb7a3ede549c2036640eb34976d3c8b69fb.png";
import imgImageCampaignLogo from "figma:asset/c3041767da6b3dfb440fa5296c3d7d64baa22d05.png";

function ImageBackground() {
  return (
    <div className="absolute h-[563.625px] left-[-2px] top-[-59.81px] w-[1002px]" data-name="Image (Background)">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImageBackground} />
    </div>
  );
}

function Container() {
  return <div className="absolute bg-gradient-to-r from-[rgba(0,0,0,0.85)] h-[300px] left-0 to-[rgba(0,0,0,0)] top-0 via-1/2 w-[600px]" data-name="Container" />;
}

function Text() {
  return (
    <div className="h-[16px] relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-[18.617px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Display:Bold',sans-serif] leading-[16px] left-[19px] not-italic text-[15px] text-nowrap text-right text-white top-0 translate-x-[-100%]">Rp</p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[22px] relative shrink-0 w-[70.961px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Display:Regular',sans-serif] leading-[22px] left-[71px] not-italic text-[18px] text-nowrap text-right text-white top-[-2px] translate-x-[-100%]">Discount</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col h-[69px] items-end justify-between left-[0.18px] pb-[4px] pt-0 px-0 top-[-2.7px] w-[71px]" data-name="Container">
      <Text />
      <Text1 />
    </div>
  );
}

function Text2() {
  return (
    <div className="absolute h-[66px] left-[4px] shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] top-0 w-[92.242px]" data-name="Text">
      <p className="absolute font-['Tiket_Odyssey_Display:ExtraBold',sans-serif] leading-[66px] left-0 not-italic text-[#fedd00] text-[80px] text-nowrap top-0 tracking-[-4px]">50</p>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[15px] relative shrink-0 w-[26.242px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[15px] left-0 not-italic text-[#0064d2] text-[15px] text-nowrap top-[0.5px]">mio</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute bg-white content-stretch flex items-center justify-center left-[88.24px] pl-0 pr-[0.008px] py-0 rounded-[1.67772e+07px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-[30px] top-[27px]" data-name="Container">
      <Text3 />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[66px] left-[71.18px] top-0 w-[126.242px]" data-name="Container">
      <Text2 />
      <Container2 />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute h-[66px] left-0 top-[51.4px] w-[201.203px]" data-name="Container">
      <Container1 />
      <Container3 />
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex h-[27.5px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Tiket_Odyssey_Display:SemiBold',sans-serif] leading-[26.4px] not-italic relative shrink-0 text-[24px] text-nowrap text-white">final banget ini bro tolong</p>
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute content-stretch flex flex-col h-[26.398px] items-start left-[0.18px] pb-0 pt-[-1px] px-0 shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] top-[-9.3px] w-[282.648px]" data-name="Heading 3">
      <Text4 />
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute h-[117.398px] left-[20px] top-[92.3px] w-[290px]" data-name="Container">
      <p className="absolute font-['Tiket_Odyssey_Display:SemiBold',sans-serif] leading-[27px] left-[0.18px] not-italic text-[18px] text-nowrap text-white top-[14.7px]">Ini diisi apa enaknya ya</p>
      <Container4 />
      <Heading />
    </div>
  );
}

function Text5() {
  return (
    <div className="absolute content-stretch flex h-[7px] items-start left-[20px] top-[277.1px] w-[77.875px]" data-name="Text">
      <p className="font-['Tiket_Odyssey_Display:Regular',sans-serif] leading-[8.4px] not-italic relative shrink-0 text-[6px] text-[rgba(255,255,255,0.8)] text-nowrap">*Terms and Conditions apply</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute h-[300px] left-0 top-0 w-[330px]" data-name="Container">
      <Container5 />
      <Text5 />
    </div>
  );
}

function ImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlinesC93Fe71B41F047DcA02BDccd8F4C810CPng() {
  return (
    <div className="h-[27px] relative shrink-0 w-[54px]" data-name="Image (https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/Banners/Assets/Logo/Airlines/c93fe71b-41f0-47dc-a02b-dccd8f4c810c.png)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlinesC93Fe71B41F047DcA02BDccd8F4C810CPng} />
    </div>
  );
}

function ImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlines6F83B840F328420393124C7E09226076Png() {
  return (
    <div className="h-[27px] relative shrink-0 w-[54px]" data-name="Image (https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/Banners/Assets/Logo/Airlines/6f83b840-f328-4203-9312-4c7e09226076.png)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlines6F83B840F328420393124C7E09226076Png} />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[22px] h-[35px] items-center left-[428px] pl-[26px] pr-0 py-0 rounded-bl-[1.67772e+07px] rounded-tl-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] top-[16px] w-[172px]" data-name="Container">
      <ImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlinesC93Fe71B41F047DcA02BDccd8F4C810CPng />
      <ImageHttpsRrrcbsjmcwlkndolwgstSupabaseCoStorageV1ObjectPublicBannersAssetsLogoAirlines6F83B840F328420393124C7E09226076Png />
    </div>
  );
}

function ImageCampaignLogo() {
  return (
    <div className="absolute h-[36px] left-[16px] top-[16px] w-[72px]" data-name="Image (Campaign Logo)">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImageCampaignLogo} />
    </div>
  );
}

export default function Container8() {
  return (
    <div className="overflow-clip relative rounded-[12px] size-full" data-name="Container" style={{ backgroundImage: "linear-gradient(153.435deg, rgb(79, 172, 254) 0%, rgb(0, 242, 254) 100%)" }}>
      <ImageBackground />
      <Container />
      <Container6 />
      <Container7 />
      <ImageCampaignLogo />
    </div>
  );
}