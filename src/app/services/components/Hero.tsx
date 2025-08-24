const Hero = () => {
  return (
    <div className=" bg-violeta px-3.5 pt-[12px] xl:pt-[58px] pb-[45px] rounded-b-[30px] sm:rounded-b-[55px] xl:rounded-b-[100px]">
      <h1 className=" text-white text-[19px] sm:text-[26px] xl:text-[46px] font-[500] text-center">Transforma tu visión en realidad digital</h1>
      <p className=" text-white text-[15px] xl:text-[26px] mt-4 xl:mt-[24px] text-center">
        Desarrollamos sitios y aplicaciones web que conectan con tu público y
        potencian tu negocio.
      </p>
      <div className=" flex justify-center mt-6 xl:mt-[80px]">
      <button className=" bg-yellow px-6 xl:px-[50px] py-1.5 xl:py-[12px]  rounded-[115px] text-black font-[500] sm:text-[17px] xl:text-[28px] cursor-pointer" >Hablemos</button>
      </div>

    </div>
  )
}

export default Hero
