import './style.scss'
import { Global } from './global.js'
import { gsap } from "gsap"
import "./script_2.js"
import { enablePointerRotation, onGyroPermissionUpdated } from "./script_2.js"


let anim = {
    landingPage: null,
    instrPage: null,
    lookaround: null,
    objectItem: null,
    resultBox: null,
    RetryButton: null
};
var batBowlBtnFlag = false;
var playBtnFlag = false;

var lookAroundInterval;
let instPageTimerInterval;

var battingObjects = ["BatB", "kneepadB", "helmetB", "batting_gloveB", "shoeblueB"];
var bowlingObjects = ["redBallB", "capB", "helmetB", "keeperGloveB", "shoeblueB"];

export var choice = {
    batting: false,
    bowling: false
}

const clickAudio = document.getElementById('clickAudio');
const collectAudio = document.getElementById('collectAudio');
// const bgAudio = document.getElementById('bgAudio');


window.onload = function () {

    Global.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    // landingPageIn()
    // InstructionAnimation();
}



document.querySelectorAll("#battingBtn, #bowlingBtn").forEach((element) => {
    const img = element.querySelector("img");
    element.addEventListener("mouseenter", () => {
        if (!batBowlBtnFlag) return;
        if (element.id === "battingBtn") {
            img.src = "./UI/BattingRoll.png"
        } else if (element.id === "bowlingBtn") {
            img.src = "./UI/BowlingRoll.png"
        }
    });
    element.addEventListener("mouseleave", () => {
        if (!batBowlBtnFlag) return;

        if (element.id === "battingBtn") {
            img.src = "./UI/Battingdefault.png"
        } else if (element.id === "bowlingBtn") {
            img.src = "./UI/Bowlingdefault.png"
        }
    });
    element.addEventListener("click", () => {
        if (!batBowlBtnFlag) return
        batBowlBtnFlag = false;
        playBtnFlag = true;
        clickAudio.play()
        // anim.landingPage.reverse();
        anim.landingPage.timeScale(1.3).reverse();
        if (element.id === "battingBtn") {
            img.src = "./UI/BattingRoll.png"
            choice.batting = true;
        } else if (element.id === "bowlingBtn") {
            choice.bowling = true;
            img.src = "./UI/BowlingRoll.png"
        }

        assignTexture()
    });
});

var playButton = document.getElementById('PlayButton')
const playButtonImg = playButton.querySelector("img");
playButton.addEventListener('click', () => {
    if (!playBtnFlag) return;
    playBtnFlag = false;
    playButtonImg.src = "./UI/PlayButton.png"
    clickAudio.play()
    startGame();
})
playButton.addEventListener("mouseenter", () => {
    if (!playBtnFlag) return;
    playButtonImg.src = "./UI/PlayButton.png"
});
playButton.addEventListener("mouseleave", () => {
    if (!playBtnFlag) return;
    playButtonImg.src = "./UI/PlayRoll.png"
});

var retryButton = document.getElementById('RetryButton')
const retryButtonImg = retryButton.querySelector("img");

retryButton.addEventListener('click', () => {
    clickAudio.play()
    retryButtonImg.src = "./UI/Retry.png"
    Global.autoRotate = false;
    window.location.reload();

})
retryButton.addEventListener("mouseenter", () => {
    // console.log("mouseenter")
    retryButtonImg.src = "./UI/Retry.png"
});
retryButton.addEventListener("mouseleave", () => {
    // console.log("mouseleave")
    retryButtonImg.src = "./UI/RetryRoll.png"
});




export function landingPageIn() {
    document.querySelector(".landingPage").style.display = "flex";

    anim.landingPage = gsap.from(".title, #battingBtn, #bowlingBtn,#orText,.chooseInstrudtion", {
        x: -200,
        opacity: 0,
        duration: 1.0,
        stagger: 0.2,
        ease: "elastic.out(1, 0.75)",
        onComplete: () => {
            batBowlBtnFlag = true; // only forward
        },
        onReverseComplete: () => {
            document.querySelector(".landingPage").style.display = "none";
            instPageIn();
        }
    });
}

function instPageIn() {
    document.querySelector(".InstructionPage").style.display = "flex";
    startInstPageTimer();
    anim.instrPage = gsap.from(".InstructionBox, #PlayButton", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        onReverseComplete: () => {
            document.querySelector(".InstructionPage").style.display = "none";
            clearInterval(instPageTimerInterval);
            lookAroundInstIn()
            objectItemsIn()
        }
    });
}

function lookAroundInstIn() {

    if (!Global.isMobile && !Global.deviceOrientationAvailable) enablePointerRotation()
    document.querySelector(".LookAroundInstContainer").style.display = "block";
    document.querySelector(".blackTint").style.display = "none";
    InstructionAnimation();
    anim.lookaround = gsap.from(".LookAroundInstContainer", {
        x: -200,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "elastic.out(1, 0.75)",
        onComplete: () => {
            setTimeout(() => {
                anim.lookaround.timeScale(1.3).reverse();
            }, 2000);
        },
        onReverseComplete: () => {
            clearInterval(lookAroundInterval);
            document.querySelector(".LookAroundInstContainer").style.display = "none";
        }
    });
}

function objectItemsIn() {
    document.querySelector(".objectHolder").style.display = "flex";
    document.querySelector(".timerContainer").style.display = "block";

    anim.objectItem = gsap.from(".objectItemBg", {
        x: 200,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: "elastic.out(1, 0.75)",
        onReverseComplete: () => {
            ressultPageIn();
        }
    });

    anim.timeContainer = gsap.from(".timerContainer", {
        y: 100,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: "power3.out",

    });
}

function ressultPageIn() {
    document.querySelector(".ResultPage").style.display = "flex";

    anim.resultBox = gsap.from(".ResultBox", {
        y: 200,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: "elastic.out(1, 0.75)",
    });

    anim.RetryButton = gsap.from("#RetryButton", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
    });
}

function startGame() {
    Global.isMobile ? requestOrientationPermission() : anim.instrPage.timeScale(1.3).reverse()
}
export function gameOver() {
    Global.autoRotate = true;
    anim.objectItem.timeScale(1.3).reverse();
    anim.timeContainer.timeScale(1.3).reverse();
    document.querySelector(".blackTint").style.display = "block";

    if (Global.score < 5) {
        document.querySelector(".ResultBox img").src = "./UI/Timeup.png"
    }
    else {
        document.querySelector(".ResultBox img").src = "./UI/GreatJob.png"

    }
}

function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS 13+ devices
        DeviceOrientationEvent.requestPermission().then((permissionState) => {
            if (permissionState === "granted") {
                anim.instrPage.timeScale(1.3).reverse();
                Global.deviceOrientationAvailable = true;
                onGyroPermissionUpdated()

            } else {
                // alert("Permission denied. Cannot use gyroscope.")
                anim.instrPage.timeScale(1.3).reverse();
                enablePointerRotation()
            }
        }).catch((err) => {
            console.error(err)
        })
    } else {
        anim.instrPage.timeScale(1.3).reverse();
        Global.deviceOrientationAvailable = true;
        onGyroPermissionUpdated();
    }
}

var count = 0;

function glowCircleAnimation(container_Id) {
    const glowCircle = document.querySelector(`#${container_Id} .glow_circle`);
    const tickImg = document.querySelector(`#${container_Id} .tickImg`);
    if (!glowCircle) return;
    count++;
    glowCircle.style.top = "-3%";
    let value = 0;
    var circleInterval = setInterval(() => {
        value += (100 / 31); // 100% / 63 frames = 1.5875%
        if (value >= 99) {
            // value = 0;
            // tickImg
            // tickImg.style.display = "block";
            tickImg.style.opacity = "1";

            if (Global.score == 5 && count == 5) {
                gameOver();
            }
            clearInterval(circleInterval);

        }
        glowCircle.style["background-position"] = `0% ${value}%`;
    }, 40);


}

export function createSmokeExplosion(containerId) {
    collectAudio.play();
    const area = document.getElementById(containerId);

    if (!area) {
        console.error(`Container with ID "${containerId}" not found.`);
        return;
    }

    const particlesToCreate = 100;
    let particlesFinished = 0;

    for (let i = 0; i < particlesToCreate; i++) {
        const particle = document.createElement('span');
        particle.classList.add('powder-particle');

        const angle = Math.random() * 360;
        particle.style.setProperty('--angle', `${angle}deg`);
        particle.style.setProperty('--duration', `${Math.random() * 0.8 + 0.4}s`);

        area.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
            particlesFinished++;

            // Call glowCircleAnimation when all particles are done
            if (particlesFinished === particlesToCreate - 92) {
                glowCircleAnimation(containerId);
            }
        });
    }
}

function assignTexture() {
    var instructionBoxImg = document.querySelector(".InstructionBox img");
    var objectImagecontainers = document.querySelectorAll(".objectItemBg");


    if (choice.batting) {
        instructionBoxImg.src = "./UI/BattingInstruction.png";
        objectImagecontainers.forEach((container, index) => {
            var imgElement = container.querySelector(".objectImg");
            if (imgElement) {
                imgElement.src = './UI/' + battingObjects[index] + '.png';
            }
        });
    }
    if (choice.bowling) {
        instructionBoxImg.src = "./UI/BowlingInstruction.png";
        objectImagecontainers.forEach((container, index) => {
            var imgElement = container.querySelector(".objectImg");
            if (imgElement) {
                imgElement.src = './UI/' + bowlingObjects[index] + '.png';
            }
        });
    }
}


function InstructionAnimation(container_Id) {
    const instDiv = document.querySelector(`.lookAroundAnime`);
    if (!instDiv) return;
    var num;

    if (Global.isMobile) {
        instDiv.style.backgroundImage = 'url("./UI/mobileLookaround.png")';

        instDiv.style.width = "17vw";
        instDiv.style.height = "calc(17vw / 1.609)";
        instDiv.style.left = "0";
        let value = 0;
        lookAroundInterval = setInterval(() => {
            value += (100 / 17);
            if (value >= 99) {
                // value = 0;
                // glowCircle.style.top = "-3%";
            }
            instDiv.style["background-position"] = `0% ${value}%`;
        }, 150);
    } else {
        instDiv.style.backgroundImage = 'url("./UI/desktopLookAroundInst.png")';
        instDiv.style.width = "13vw";
        instDiv.style.height = "13vw";
        instDiv.style.left = "8%";
        instDiv.style["max-width"] = "90px";
        instDiv.style["max-height"] = "90px";
        let value = 0;
        lookAroundInterval = setInterval(() => {
            value += 100 / 32;
            if (value >= 100) {
                value = 0;
                // glowCircle.style.top = "-3%";
            }
            instDiv.style["background-position"] = `0% ${value}%`;
        }, 40);
    }





}

function startInstPageTimer() {
    const timerDiv = document.querySelector(`.instPageTimer`);

    let value = 0;
    instPageTimerInterval = setInterval(() => {
        value += (100 / 30);
        if (value >= 99) {
            value = 0;
            // glowCircle.style.top = "-3%";
        }
        timerDiv.style["background-position"] = `0% ${value}%`;
    }, 80);
}


document.getElementById("SoundIcon").addEventListener("click", () => {
    const bgAudio = document.getElementById('bgAudio');
    const soundIconImg = document.querySelector("#SoundIcon img");
    if (bgAudio.paused) {
        bgAudio.play();
        soundIconImg.src = "./UI/Sound.png"
    } else {
        bgAudio.pause();
        soundIconImg.src = "./UI/Mute.png"
    }
});














// gsap.from(".title, #battingBtn, #bowlingBtn", {
//     y: 100,
//     opacity: 0,
//     duration: 1,
//     stagger: 0.2,
//     ease: "power3.out"
// });

// gsap.from(".title, #battingBtn, #bowlingBtn", {
//     scale: 0.3,
//     opacity: 0,
//     duration: 0.8,
//     stagger: 0.15,
//     ease: "back.out(1.7)"
// });

// gsap.from(".title, #battingBtn, #bowlingBtn", {
//     x: -200,
//     opacity: 0,
//     duration: 1.2,
//     stagger: 0.25,
//     ease: "elastic.out(1, 0.75)"
// });

// gsap.from(".title, #battingBtn, #bowlingBtn", {
//     rotation: 360,
//     scale: 0,
//     opacity: 0,
//     duration: 1,
//     stagger: 0.2,
//     ease: "expo.out"
// });