import svgPaths from "./svg-2y1d9thuze";

function Label() {
  return (
    <div className="h-[21px] relative shrink-0 w-[121.086px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[21px] left-0 not-italic text-[#303135] text-[14px] text-nowrap top-[-1px]">Discount Amount 1</p>
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="absolute h-[18px] left-[24px] top-0 w-[50.578px]" data-name="Text">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#9ea0a5] text-[12px] text-nowrap top-px uppercase">#ffffff</p>
    </div>
  );
}

function SlotClone() {
  return <div className="absolute bg-white border border-[#d8dce8] border-solid left-0 rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] size-[16px] top-px" data-name="SlotClone" />;
}

function ColorPicker() {
  return (
    <div className="h-[18px] relative shrink-0 w-[74.578px]" data-name="ColorPicker">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text />
        <SlotClone />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[21px] items-center left-0 top-0 w-[455px]" data-name="Container">
      <Label />
      <ColorPicker />
    </div>
  );
}

function FormStep() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[23.172px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">IDR</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[20.83%]" data-name="Vector">
        <div className="absolute inset-[-21.43%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p26df68f0} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #0064D2)" strokeWidth="6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon />
    </div>
  );
}

function RadioButton() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container2() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container1 />
      <RadioButton />
    </div>
  );
}

function Radio() {
  return (
    <div className="h-[24px] relative shrink-0 w-[55.172px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep />
        <Container2 />
      </div>
    </div>
  );
}

function FormStep1() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[55.906px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">Non-IDR</p>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.42%]" data-name="Vector">
        <div className="absolute inset-[-2.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p2ac3bc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #AEB2BE)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon1 />
    </div>
  );
}

function RadioButton1() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container4() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container3 />
      <RadioButton1 />
    </div>
  );
}

function Radio1() {
  return (
    <div className="h-[24px] relative shrink-0 w-[87.906px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep1 />
        <Container4 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex gap-[24px] h-[24px] items-start left-0 top-[29px] w-[455px]" data-name="Container">
      <Radio />
      <Radio1 />
    </div>
  );
}

function StyledInput() {
  return (
    <div className="absolute bg-white h-[43px] left-0 rounded-[8px] top-0 w-[455px]" data-name="StyledInput">
      <div className="content-stretch flex items-center overflow-clip px-[12px] py-[10px] relative rounded-[inherit] size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#9ea0a5] text-[14px] text-nowrap tracking-[-0.1504px]">Discount amount</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Text1() {
  return (
    <div className="absolute h-[18px] left-[421.5px] top-[12.5px] w-[21.5px]" data-name="Text">
      <p className="absolute font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#9ea0a5] text-[12px] top-0 w-[22px]">0/3</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute h-[43px] left-0 top-[61px] w-[455px]" data-name="Container">
      <StyledInput />
      <Text1 />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute h-[104px] left-0 top-0 w-[455px]" data-name="Container">
      <Container />
      <Container5 />
      <Container6 />
    </div>
  );
}

function Label1() {
  return (
    <div className="h-[21px] relative shrink-0 w-[26.391px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[21px] left-0 not-italic text-[#303135] text-[14px] text-nowrap top-[-1px]">Unit</p>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="absolute h-[18px] left-[24px] top-0 w-[50.578px]" data-name="Text">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#9ea0a5] text-[12px] text-nowrap top-px uppercase">#0064D2</p>
    </div>
  );
}

function SlotClone1() {
  return <div className="absolute bg-[#0064d2] border border-[#d8dce8] border-solid left-0 rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] size-[16px] top-px" data-name="SlotClone" />;
}

function ColorPicker1() {
  return (
    <div className="h-[18px] relative shrink-0 w-[74.578px]" data-name="ColorPicker">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text2 />
        <SlotClone1 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[21px] relative shrink-0 w-[455px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Label1 />
        <ColorPicker1 />
      </div>
    </div>
  );
}

function FormStep2() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[9.008px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">K</p>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[20.83%]" data-name="Vector">
        <div className="absolute inset-[-21.43%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p26df68f0} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #0064D2)" strokeWidth="6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon2 />
    </div>
  );
}

function RadioButton2() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container10() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container9 />
      <RadioButton2 />
    </div>
  );
}

function Radio2() {
  return (
    <div className="h-[24px] relative shrink-0 w-[41.008px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep2 />
        <Container10 />
      </div>
    </div>
  );
}

function FormStep3() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[24.039px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">mio</p>
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.42%]" data-name="Vector">
        <div className="absolute inset-[-2.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p2ac3bc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #AEB2BE)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon3 />
    </div>
  );
}

function RadioButton3() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container12() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container11 />
      <RadioButton3 />
    </div>
  );
}

function Radio3() {
  return (
    <div className="h-[24px] relative shrink-0 w-[56.039px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep3 />
        <Container12 />
      </div>
    </div>
  );
}

function FormStep4() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[12.563px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">%</p>
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.42%]" data-name="Vector">
        <div className="absolute inset-[-2.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p2ac3bc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #AEB2BE)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon4 />
    </div>
  );
}

function RadioButton4() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container14() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container13 />
      <RadioButton4 />
    </div>
  );
}

function Radio4() {
  return (
    <div className="h-[24px] relative shrink-0 w-[44.563px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep4 />
        <Container14 />
      </div>
    </div>
  );
}

function PrimitiveSpan() {
  return <div className="bg-white rounded-[1.67772e+07px] shrink-0 size-[16px]" data-name="Primitive.span" />;
}

function PrimitiveButton() {
  return (
    <div className="basis-0 bg-[#cbced4] grow h-[18.398px] min-h-px min-w-px relative rounded-[1.67772e+07px] shrink-0" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[1.67772e+07px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center p-px relative size-full">
        <PrimitiveSpan />
      </div>
    </div>
  );
}

function Label2() {
  return (
    <div className="h-[21px] relative shrink-0 w-[27.328px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] left-0 not-italic text-[#303135] text-[14px] text-nowrap top-[-1px]">Icon</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[21px] relative shrink-0 w-[71.328px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <PrimitiveButton />
        <Label2 />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[455px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
        <Radio2 />
        <Radio3 />
        <Radio4 />
        <Container15 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[53px] items-start left-0 top-[128px] w-[455px]" data-name="Container">
      <Container8 />
      <Container16 />
    </div>
  );
}

function Label3() {
  return (
    <div className="h-[21px] relative shrink-0 w-[121.086px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[21px] left-0 not-italic text-[#303135] text-[14px] text-nowrap top-[-1px]">Discount Amount 2</p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="absolute h-[18px] left-[24px] top-0 w-[50.578px]" data-name="Text">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#9ea0a5] text-[12px] text-nowrap top-px uppercase">#ffffff</p>
    </div>
  );
}

function SlotClone2() {
  return <div className="absolute bg-white border border-[#d8dce8] border-solid left-0 rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] size-[16px] top-px" data-name="SlotClone" />;
}

function ColorPicker2() {
  return (
    <div className="h-[18px] relative shrink-0 w-[74.578px]" data-name="ColorPicker">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text3 />
        <SlotClone2 />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[21px] items-center left-0 top-0 w-[455px]" data-name="Container">
      <Label3 />
      <ColorPicker2 />
    </div>
  );
}

function FormStep5() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[23.172px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">IDR</p>
    </div>
  );
}

function Icon5() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[20.83%]" data-name="Vector">
        <div className="absolute inset-[-21.43%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p26df68f0} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #0064D2)" strokeWidth="6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon5 />
    </div>
  );
}

function RadioButton5() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container20() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container19 />
      <RadioButton5 />
    </div>
  );
}

function Radio5() {
  return (
    <div className="h-[24px] relative shrink-0 w-[55.172px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep5 />
        <Container20 />
      </div>
    </div>
  );
}

function FormStep6() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[55.906px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">Non-IDR</p>
    </div>
  );
}

function Icon6() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.42%]" data-name="Vector">
        <div className="absolute inset-[-2.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p2ac3bc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #AEB2BE)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon6 />
    </div>
  );
}

function RadioButton6() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container22() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container21 />
      <RadioButton6 />
    </div>
  );
}

function Radio6() {
  return (
    <div className="h-[24px] relative shrink-0 w-[87.906px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep6 />
        <Container22 />
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute content-stretch flex gap-[24px] h-[24px] items-start left-0 top-[29px] w-[455px]" data-name="Container">
      <Radio5 />
      <Radio6 />
    </div>
  );
}

function StyledInput1() {
  return (
    <div className="absolute bg-white h-[43px] left-0 rounded-[8px] top-0 w-[455px]" data-name="StyledInput">
      <div className="content-stretch flex items-center overflow-clip px-[12px] py-[10px] relative rounded-[inherit] size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#9ea0a5] text-[14px] text-nowrap tracking-[-0.1504px]">Discount amount</p>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Text4() {
  return (
    <div className="absolute h-[18px] left-[421.5px] top-[12.5px] w-[21.5px]" data-name="Text">
      <p className="absolute font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#9ea0a5] text-[12px] top-0 w-[22px]">0/3</p>
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute h-[43px] left-0 top-[61px] w-[455px]" data-name="Container">
      <StyledInput1 />
      <Text4 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute h-[104px] left-0 top-[222px] w-[455px]" data-name="Container">
      <Container18 />
      <Container23 />
      <Container24 />
    </div>
  );
}

function Label4() {
  return (
    <div className="h-[21px] relative shrink-0 w-[26.391px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:Bold',sans-serif] leading-[21px] left-0 not-italic text-[#303135] text-[14px] text-nowrap top-[-1px]">Unit</p>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="absolute h-[18px] left-[24px] top-0 w-[50.578px]" data-name="Text">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#9ea0a5] text-[12px] text-nowrap top-px uppercase">#0064D2</p>
    </div>
  );
}

function SlotClone3() {
  return <div className="absolute bg-[#0064d2] border border-[#d8dce8] border-solid left-0 rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] size-[16px] top-px" data-name="SlotClone" />;
}

function ColorPicker3() {
  return (
    <div className="h-[18px] relative shrink-0 w-[74.578px]" data-name="ColorPicker">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text5 />
        <SlotClone3 />
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="h-[21px] relative shrink-0 w-[455px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Label4 />
        <ColorPicker3 />
      </div>
    </div>
  );
}

function FormStep7() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[9.008px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">K</p>
    </div>
  );
}

function Icon7() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[20.83%]" data-name="Vector">
        <div className="absolute inset-[-21.43%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p26df68f0} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #0064D2)" strokeWidth="6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon7 />
    </div>
  );
}

function RadioButton7() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container28() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container27 />
      <RadioButton7 />
    </div>
  );
}

function Radio7() {
  return (
    <div className="h-[24px] relative shrink-0 w-[41.008px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep7 />
        <Container28 />
      </div>
    </div>
  );
}

function FormStep8() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[24.039px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">mio</p>
    </div>
  );
}

function Icon8() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.42%]" data-name="Vector">
        <div className="absolute inset-[-2.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p2ac3bc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #AEB2BE)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon8 />
    </div>
  );
}

function RadioButton8() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container30() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container29 />
      <RadioButton8 />
    </div>
  );
}

function Radio8() {
  return (
    <div className="h-[24px] relative shrink-0 w-[56.039px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep8 />
        <Container30 />
      </div>
    </div>
  );
}

function FormStep9() {
  return (
    <div className="absolute content-stretch flex h-[18.5px] items-start left-[32px] top-[3.5px] w-[12.563px]" data-name="FormStep2">
      <p className="font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] not-italic relative shrink-0 text-[#303135] text-[14px] text-nowrap">%</p>
    </div>
  );
}

function Icon9() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.42%]" data-name="Vector">
        <div className="absolute inset-[-2.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path d={svgPaths.p2ac3bc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, #AEB2BE)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 size-[24px] top-0" data-name="Container">
      <Icon9 />
    </div>
  );
}

function RadioButton9() {
  return <div className="absolute left-0 size-[24px] top-0" data-name="Radio Button" />;
}

function Container32() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="Container">
      <Container31 />
      <RadioButton9 />
    </div>
  );
}

function Radio9() {
  return (
    <div className="h-[24px] relative shrink-0 w-[44.563px]" data-name="Radio">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <FormStep9 />
        <Container32 />
      </div>
    </div>
  );
}

function PrimitiveSpan1() {
  return <div className="bg-white rounded-[1.67772e+07px] shrink-0 size-[16px]" data-name="Primitive.span" />;
}

function PrimitiveButton1() {
  return (
    <div className="basis-0 bg-[#cbced4] grow h-[18.398px] min-h-px min-w-px relative rounded-[1.67772e+07px] shrink-0" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[1.67772e+07px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center p-px relative size-full">
        <PrimitiveSpan1 />
      </div>
    </div>
  );
}

function Label5() {
  return (
    <div className="h-[21px] relative shrink-0 w-[27.328px]" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Tiket_Odyssey_Text:SemiBold',sans-serif] leading-[21px] left-0 not-italic text-[#303135] text-[14px] text-nowrap top-[-1px]">Icon</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[21px] relative shrink-0 w-[71.328px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <PrimitiveButton1 />
        <Label5 />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[455px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
        <Radio7 />
        <Radio8 />
        <Radio9 />
        <Container33 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] h-[53px] items-start left-0 top-[350px] w-[455px]" data-name="Container">
      <Container26 />
      <Container34 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <Container7 />
      <Container17 />
      <Container25 />
      <Container35 />
    </div>
  );
}