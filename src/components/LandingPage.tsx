"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface LandingPageProps {
  onStartTrip: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartTrip }) => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mainRef.current) return;

    const images = Array.from(mainRef.current.querySelectorAll("img"));
    const promises = images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; 
      });
    });

    let timeline: gsap.core.Timeline;
    let handleMouseMove: (e: MouseEvent) => void;

    Promise.all(promises).then(() => {
      if (!mainRef.current) return;

      const parallax_el = mainRef.current.querySelectorAll(".parallax");
      
      let xValue = 0;
      let yValue = 0;
      let rotateDegree = 0;

      function update(cursorPosition: number) {
        parallax_el.forEach((el: any) => {
          let speedX = el.dataset.speedx;
          let speedY = el.dataset.speedy;
          let speedZ = el.dataset.speedz;
          let rotationSpeed = el.dataset.rotation;

          let isInLeft = parseFloat(getComputedStyle(el).left) < window.innerWidth / 2 ? 1 : -1;
          let zValue = (cursorPosition - parseFloat(getComputedStyle(el).left)) * isInLeft * 0.1;

          el.style.transform = `perspective(2300px) translateZ(${
            zValue * speedZ
          }px) rotateY(${rotateDegree * rotationSpeed}deg) translateX(calc(-50% + ${
            -xValue * speedX
          }px)) translateY(calc(-50% + ${yValue * speedY}px))`;
        });
      }

      update(0);

      handleMouseMove = (e: MouseEvent) => {
        if (timeline && timeline.isActive()) return;

        xValue = e.clientX - window.innerWidth / 2;
        yValue = e.clientY - window.innerHeight / 2;
        rotateDegree = (xValue / (window.innerWidth / 2)) * 20;
        update(e.clientX);
      };

      window.addEventListener("mousemove", handleMouseMove);

      // GSAP Timeline - EXACT ORIGINAL
      timeline = gsap.timeline();

      Array.from(parallax_el)
        .filter((el: any) => !el.classList.contains("text"))
        .forEach((el: any) => {
          timeline.from(
            el,
            {
              top: `${(el.offsetHeight) / 2 + +el.dataset.distance}px`,
              duration: 3.5,
              ease: "power3.out"
            },
            "1"
          );
        });

      timeline
        .from(
          ".text h1",
          {
            y: window.innerHeight - (mainRef.current?.querySelector(".text h1")?.getBoundingClientRect().top || 0) + 200,
            duration: 2
          },
          "2.5"
        )
        .from(
          ".text h2",
          {
            y: -150,
            opacity: 0,
            duration: 1.5
          },
          "3"
        )
        .from(
          ".hide",
          {
            opacity: 0,
            duration: 1.5
          },
          "3"
        );
    });

    return () => {
      if (timeline) timeline.kill();
      if (handleMouseMove) window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="landing-page-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;800&display=swap");
        
        .landing-page-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          background: #333;
          font-family: "Poppins", sans-serif;
        }

        .landing-page-container * {
          padding: 0;
          margin: 0;
          box-sizing: border-box;
        }

        .landing-page-container main {
          position: relative;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .parallax {
          pointer-events: none;
          transition: 0.45s cubic-bezier(cubic-bezier(0.2, 0.49, 0.32, 0.94));
        }

        .data .bg-img {
          position: absolute;
          width: 3200px;
          top: calc(50% - 390px);
          left: calc(50% + 50px);
          z-index: 1;
        }

        .data .fog-7 {
          position: absolute;
          width: 1900px;
          z-index: 2;
          top: calc(50% - 100px);
          left: calc(50% + 300px);
        }

        .data .mountain-10 {
          position: absolute;
          z-index: 3;
          width: 1200px;
          top: calc(50% + 169px);
          left: calc(50% + 330px);
        }

        .data .fog-6 {
          position: absolute;
          z-index: 4;
          width: 2200px;
          top: calc(50% + 285px);
          left: calc(50%);
          opacity: 0.3;
        }

        .data .mountain-9 {
          position: absolute;
          z-index: 5;
          width: 670px;
          top: calc(50% + 313px);
          left: calc(50% - 557px);
        }

        .data .mountain-8 {
          position: absolute;
          z-index: 6;
          width: 910px;
          top: calc(50% + 146px);
          left: calc(50% - 102px);
        }

        .data .fog-5 {
          position: absolute;
          z-index: 7;
          width: 650px;
          top: calc(50% + 360px);
          left: calc(50% + 40px);
        }

        .data .mountain-7 {
          position: absolute;
          z-index: 8;
          width: 738px;
          top: calc(50% + 223px);
          left: calc(50% + 495px);
        }

        .data .text {
          position: absolute;
          z-index: 9;
          top: calc(50% - 130px);
          left: calc(50%);
          text-align: center;
          text-transform: uppercase;
          pointer-events: auto;
          color: #fff;
          transform: translateX(-50%);
        }

        .data .text h2 {
          font-weight: 100;
          line-height: 0.8;
          font-size: 6.5rem;
        }

        .data .text h1 {
          font-weight: 800;
          font-size: 7rem;
          line-height: 0.8;
        }

        .mountain-6 {
          position: absolute;
          z-index: 10;
          top: calc(50% + 120px);
          left: calc(50% + 590px);
          width: 408px;
        }

        .fog-4 {
          position: absolute;
          z-index: 11;
          top: calc(50% + 223px);
          left: calc(50% + 460px);
          width: 590px;
          opacity: 0.5;
        }

        .mountain-5 {
          position: absolute;
          z-index: 12;
          top: calc(50% + 320px);
          left: calc(50% + 230px);
          width: 725px;
        }

        .fog-3 {
          position: absolute;
          z-index: 13;
          width: 1600px;
          top: calc(50% + 210px);
          left: calc(50% + 5px);
        }

        .mountain-4 {
          position: absolute;
          z-index: 15;
          top: calc(50% + 196px);
          left: calc(50% - 698px);
          width: 1100px;
        }

        .mountain-3 {
          position: absolute;
          z-index: 16;
          top: calc(50% - 20px);
          left: calc(50% + 750px);
          width: 630px;
        }

        .fog-2 {
          position: absolute;
          z-index: 16;
          top: calc(50% - 20px);
          left: calc(50% + 698px);
          width: 1100px;
        }

        .mountain-2 {
          position: absolute;
          z-index: 17;
          top: calc(50% + 256px);
          left: calc(50% + 528px);
          width: 800px;
        }

        .mountain-1 {
          position: absolute;
          z-index: 18;
          top: calc(50% + 196px);
          left: calc(50% - 728px);
          width: 1100px;
        }

        .sun-rays {
          position: absolute;
          z-index: 19;
          top: 0;
          right: 0;
          width: 695px;
        }

        .black-shadow {
          position: absolute;
          z-index: 20;
          bottom: 0;
          right: 0;
          width: 100%;
        }

        .fog-1 {
          position: absolute;
          z-index: 21;
          top: calc(100% - 355px);
          left: calc(50% + 100px);
          width: 1900px;
          opacity: 0.5;
        }

        .vignette {
          position: absolute;
          z-index: 100;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0) 65%,
            rgba(0, 0, 0, 0.7)
          );
          pointer-events: none;
        }

        /* Trip Planner Overlay Button */
        .trip-planner-btn-overlay {
          position: fixed;
          top: 30px;
          right: 40px;
          z-index: 99999;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px 30px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 13px;
        }

        .trip-planner-btn-overlay:hover {
          background: rgba(255, 255, 255, 1);
          color: black;
          transform: scale(1.05);
        }

        @media (max-width: 1100px) {
          .text h1 { font-size: 5.8rem !important; }
          .text h2 { font-size: 4.7rem !important; }
        }

        @media (max-width: 725px) {
          .text h1 { font-size: 5rem !important; line-height: 1.1; }
          .text h2 { font-size: 4.1rem !important; line-height: 1.1; }
        }
      ` }} />

      <button className="trip-planner-btn-overlay" onClick={onStartTrip}>
        Trip Planner
      </button>

      <main ref={mainRef}>
        <div className="data">
          <div className="vignette hide"></div>
          <img src="https://i.ibb.co/9mHk68Gj/background.png" data-speedx="0.3" data-speedy="0.38" data-speedz="0" data-rotation="0" data-distance="-200" alt="image" className="parallax bg-img" />
          <img src="https://i.ibb.co/DHhNwG0X/fog-7.png" data-speedx="0.27" data-speedy="0.32" data-speedz="0" data-rotation="0" data-distance="850" alt="image" className="parallax fog-7" />
          <img src="https://i.ibb.co/4gT3LR9K/mountain-10.png" data-speedx="0.195" data-speedy="0.305" data-speedz="0" data-rotation="0" data-distance="1100" alt="image" className="parallax mountain-10" />
          <img src="https://i.ibb.co/rW6cjXV/fog-6.png" data-speedx="0.25" data-speedy="0.28" data-speedz="0" data-rotation="0" data-distance="1400" alt="image" className="parallax fog-6" />
          <img src="https://i.ibb.co/3y15rgKD/mountain-9.png" data-speedx="0.125" data-speedy="0.155" data-speedz="0.15" data-rotation="0.02" data-distance="1700" alt="image" className="parallax mountain-9" />
          <img src="https://i.ibb.co/zHWDdxRR/mountain-8.png" data-speedx="0.1" data-speedy="0.11" data-speedz="0" data-rotation="0.02" data-distance="1800" alt="image" className="parallax mountain-8" />
          <img src="https://i.ibb.co/jFSMJ2t/fog-5.png" data-speedx="0.16" data-speedy="0.105" data-speedz="0" data-rotation="0" data-distance="1900" alt="image" className="parallax fog-5" />
          <img src="https://i.ibb.co/Fq5CHqZ6/mountain-7.png" data-speedx="0.1" data-speedy="0.1" data-speedz="0" data-rotation="0.09" data-distance="2000" alt="image" className="parallax mountain-7" />

          <div className="text parallax" data-speedx="0.07" data-speedy="0.07" data-speedz="0" data-rotation="0.11" data-distance="0">
            <h2>Mumbai</h2>
            <h1>Maharashtra</h1>
          </div>

          <img src="https://i.ibb.co/N2TjCDLQ/mountain-6.png" data-speedx="0.065" data-speedy="0.05" data-speedz="0.05" data-rotation="0.12" data-distance="2300" alt="image" className="parallax mountain-6" />
          <img src="https://i.ibb.co/23Xc3QwX/fog-4.png" data-speedx="0.135" data-speedy="0.1" data-speedz="0" data-rotation="0" data-distance="2400" alt="image" className="parallax fog-4" />
          <img src="https://i.ibb.co/SSfDbsF/mountain-5.png" data-speedx="0.08" data-speedy="0.05" data-speedz="0.13" data-rotation="0.1" data-distance="2550" alt="image" className="parallax mountain-5" />
          <img src="https://i.ibb.co/chZkMKzX/fog-3.png" data-speedx="0.11" data-speedy="0.018" data-speedz="0" data-rotation="0" data-distance="2800" alt="image" className="parallax fog-3" />
          <img src="https://i.ibb.co/39PKgGNS/mountain-4.png" data-speedx="0.059" data-speedy="0.024" data-speedz="0.35" data-rotation="0.14" data-distance="3200" alt="image" className="parallax mountain-4" />
          <img src="https://i.ibb.co/rKHGSD9S/mountain-3.png" data-speedx="0.04" data-speedy="0.018" data-speedz="0.32" data-rotation="0.05" data-distance="3400" alt="image" className="parallax mountain-3" />
          <img src="https://i.ibb.co/bj0s7gRP/fog-2.png" data-speedx="0.15" data-speedy="0.0115" data-speedz="0" data-rotation="0" data-distance="3600" alt="image" className="parallax fog-2" />
          <img src="https://i.ibb.co/7tHMfwZH/mountain-2.png" data-speedx="0.0235" data-speedy="0.013" data-speedz="0.42" data-rotation="0.15" data-distance="3800" alt="image" className="parallax mountain-2" />
          <img src="https://i.ibb.co/Knh5tBS/mountain-1.png" data-speedx="0.027" data-speedy="0.018" data-speedz="0.53" data-rotation="0.2" data-distance="4000" alt="image" className="parallax mountain-1" />
          
          <img src="https://i.ibb.co/MDt2jKzR/sun-rays.png" alt="image" className="sun-rays hide" />
          <img src="https://i.ibb.co/GfrKQFPh/black-shadow.png" alt="image" className="black-shadow hide" />
          <img src="https://i.ibb.co/Y41vTxSN/fog-1.png" data-speedx="0.12" data-speedy="0.01" data-speedz="0" data-rotation="0" data-distance="4200" alt="image" className="parallax fog-1" />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
