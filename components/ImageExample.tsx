import React from 'react'
import Image from 'next/image';

const ImageExample = () => {
    return (
        <div className='w-full md:w-100 grid justify-center items-center overflow-x-hidden'>
            {/* Image Container */}
            <div className="relative w-85 lg:w-90 xl:w-100 h-68 md:h-56 lg:h-64 xl:h-70 overflow-hidden rounded-3xl md:rounded-4xl grid justify-center items-center mx-auto">
                <Image
                    src="https://i.pinimg.com/736x/95/ee/ef/95eeef6857b8bcf7aca641eb02274d73.jpg"
                    alt="HEIC to JPG example"
                    fill
                    className="object-cover select-none"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    draggable={false}
                />
            </div>
            
            {/* Text Content */}
            <div className='py-4 sm:py-5 mt-2'>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-center md:text-left w-90">
                    HEIC to JPG Converter
                </h1>
                <div className='flex flex-row items-center justify-center md:justify-start mt-3 gap-1 sm:gap-0'>
                    <span className='text-base sm:text-lg md:text-xl font-bold text-gray-600 text-center sm:text-left'>
                        100% optimize, Try it for
                    </span>
                    <span className='text-base sm:text-lg md:text-xl font-bold text-black px-2 py-0.5 sm:px-3 sm:py-1 sm:ml-1 rounded-full bg-green-400 min-w-15 sm:min-w-17.5 text-center'>
                        Free
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ImageExample;