"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const HeroSection = () => {
    const imageRef = useRef();
    useEffect(() => {
        const imageElement = imageRef.current;
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 100;
            if(scrollPosition > scrollThreshold) {
                imageElement.classList.add("scrolled");
            } else {
                imageElement.classList.remove("scrolled");
            }
        }
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        }
    },[])
  return (
    <div className="pb-20 px-4">
        <div className="container mx-auto text-center">
            <h1 className="text-5xl md:8xl lg:text-[105px] pb-12 gradient-title">
                Stronger Insights <br/> Stronger Finances
            </h1>
            <p className="text-xl text-gray-500 mb-8 mt-8 max-w-2xl mx-auto font-semibold">
                Manage your finances with our AI-powered finance manager platform 
                that helps you track, analyze and optimize your transactions with real-time insights  
            </p>
            <div>
                <Link href = "/dashboard">
                    <Button size = "lg" className = "px-8">
                        Get Started
                    </Button>
                </Link>
            </div>
            <div className="hero-image-wrapper">
                <div ref={imageRef} className="hero-image">
                    <Image src = "/banner.png" 
                        width={1280} 
                        height={720} 
                        alt="Dashboard Preview"
                        className="rounded-lg shadow 2xl border mx-auto"
                        priority
                    />
                </div>
            </div>
        </div>
    </div>
  )
}

export default HeroSection;