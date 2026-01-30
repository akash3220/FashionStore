import * as THREE from 'three'
// import './style.scss'
import { Global } from './global.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { gsap } from "gsap";
import orientationControl from 'three.orientation';
import { landingPageIn, gameOver, choice, createSmokeExplosion } from "./script.js"
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js';


if (import.meta.hot) {
    import.meta.hot.accept(() => {
        window.location.reload();
    });
}
// const stats = new Stats();
// document.body.appendChild(stats.dom);

window.THREE = THREE;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

var currentTime = 0;
var timerDuration = 60;
var startTime = -1;
var elapsedTime = 0;
var clock = new THREE.Clock();
Global.timeUp = false;
const lerpFactor = 0.18
Global.score = 0;

let modelRoot = null                   // reference to loaded model
const targetRotation = new THREE.Euler(0, 0, 0, 'XYZ')
let isPointerDown = false
let pointerStart = { x: 0, y: 0 }
const rotationSpeed = 0.005
let usingPointerRotation = null

var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2()



var mouseDown = false;
var moveThreshold = 15
var mouseDownPosition = {
    x: 0,
    y: 0
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const selectedItems = new Set()
const itemsGroup = new THREE.Group()
scene.add(itemsGroup)

const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height)
camera.position.set(0, 0, 1);
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.physicallyCorrectLights = true; // Enable physically correct lighting


renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  //1.5

renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = .5;         // tweak to taste (0.6 - 2.0 common)
renderer.outputEncoding = THREE.sRGBEncoding; // final output in sRGB for the canvas
renderer.shadowMap.enabled = true
renderer.render(scene, camera)


let controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true;
controls.enabled = true;   //false change

// Lights
// const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
// scene.add(ambientLight)

// or using color string
const dirLight = new THREE.DirectionalLight('#c6c6c6', 12.10)
dirLight.castShadow = true
dirLight.shadow.normalBias = 0.027
dirLight.shadow.bias = - 0.0004

// const helper = new THREE.DirectionalLightHelper(dirLight, 5);
// scene.add(helper);
dirLight.position.set(0, 1.7, 0);

// Increase shadow resolution
const shadowMapSize = Global.isMobile ? 510 : 1024;
dirLight.shadow.mapSize.width = shadowMapSize;
dirLight.shadow.mapSize.height = shadowMapSize;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Shadow camera area (default is tiny)
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 8;
dirLight.shadow.camera.bottom = -10;



// Slight softness
dirLight.shadow.radius = 1;

scene.add(dirLight)

// Sky color, Ground color, Intensity
const hemiLight = new THREE.HemisphereLight('#ffffff', '#ffffff', 2.0);
scene.add(hemiLight);

const helper1 = new THREE.HemisphereLight(dirLight, 5);
scene.add(helper1);

const rgbeLoader = new RGBELoader();
rgbeLoader.load('./Textures/bg.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;
    Global.envMap = environmentMap;

    // this.assetLoader.prepare();
});


let initialRotation = new THREE.Euler();


const dracoLoader = new DRACOLoader()

// IMPORTANT: path where Draco decoder files are hosted
dracoLoader.setDecoderPath('/draco/')
// or CDN (recommended)
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

// Load model
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader)
loader.load('./models/FashionStore.glb', (gltf) => {

    document.querySelector("#loader").style.display = "none";
    // setTimeout(() => {
    //     landingPageIn()
    //     // enablePointerRotation()
    // }, 500);


    const model = gltf.scene;
    modelRoot = model;

    model.scale.set(1, 1, 1);
    model.position.set(0, -1.5, 0);             //-1.5

    scene.add(model);

    model.traverse((child) => {
        if (child.isMesh) {


            child.material.envMap = Global.envMap;
            child.material.envMapIntensity = .6;

            child.receiveShadow = true;

            child.material.lightMap = null;
            child.material.aoMapIntensity = 0;
            // console.log(child.name, child.material.name);
            if (!child.name.includes('floor')) {
                child.castShadow = true;
            }
            if (child.name == "roof_Baked" || child.name == "roof001_Baked") {
                // child.castShadow = false;
                // child.receiveShadow = false;
            }
            // console.log(child.name, child.receiveShadow);

            if (child.name.includes('Null_Tube_11')) {
                if (child.material && typeof child.material.roughness !== 'undefined') {
                    child.material.roughness = 1;
                }
            }
        }
    });

    // Save initial rotation
    initialRotation.copy(model.rotation);

    setTimeout(() => {
        // Global.autoRotate = true;
    }, 500);
});


window.addEventListener('click', onClick)
window.addEventListener('touchstart', onClick, true); // For touch
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);


function onClick(event) {
    if (choice.batting === false && choice.bowling === false) return;

    if (event.type === 'touchstart') {
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

    } else {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.set(mouse.x, mouse.y, 1).unproject(camera).sub(camera.position).normalize();

    if (!modelRoot) return

    const intersects = raycaster.intersectObjects(modelRoot.children, true)
    // console.log('Intersects:', intersects);
    // console.log('gh', intersects.length);
    // console.log("3tr", modelRoot.children);


    if (intersects.length > 0) {
        const clicked = intersects[0].object;
        // console.log("Click/touch detected", clicked.name);
        // console.log("Clicked object:", clicked);
        // console.log("Intersects length:", clicked.parent.name, "fghjk", modelRoot.name);
        // console.log(modelRoot)

        //Helmate
        if (clicked.name === 'Mesh004_1' || clicked.name === 'Mesh005_2' || clicked.name === 'Mesh005_1') {  //Helmate
            clickedObjectParent(clicked, modelRoot, "objectItemContainer3");
        }
        //Shoes
        if (clicked.name === 'model_0005') { //shoes has lot of parent
            animateHelmetToScreen(clicked, "objectItemContainer5");
        }

        if (choice.batting) {
            // Bat
            if (clicked.name === "bat020") { //bat no parent   
                clickedObjectParent(clicked, modelRoot, "objectItemContainer1");
            }
            //kneepad 
            if (clicked.name === "kneepad005") { //shoes has lot of parent
                clickedObjectParent(clicked, modelRoot, "objectItemContainer2");
            }
            //Gloves 
            if (clicked.name === "glov012") { //shoes has lot of parent
                clickedObjectParent(clicked, modelRoot, "objectItemContainer4");
            }
        }

        if (choice.bowling) {
            // Ball
            if (clicked.name === "ball015") { //ball no parent
                clickedObjectParent(clicked, modelRoot, "objectItemContainer1");
            }
            //Cap cap014
            if (clicked.name === "cap") {
                clickedObjectParent(clicked, modelRoot, "objectItemContainer2");
            }
            //gloves
            if (clicked.name === "11734_protective_gear_v1_L3_1" || clicked.name === "glov012" || clicked.name === "11734_protective_gear_v1_L3") { //shoes has lot of parent
                clickedObjectParent(clicked, modelRoot, "objectItemContainer4");
            }
        }






    }
}

function onMouseDown(event) {
    mouseDown = true;

    // Capture initial mouse position
    mouseDownPosition.x = event.clientX;
    mouseDownPosition.y = event.clientY;
}
function onMouseUp(event) {
    if (mouseDown) {
        // Calculate mouse movement
        const moveX = event.clientX - mouseDownPosition.x;
        const moveY = event.clientY - mouseDownPosition.y;
        const distance = Math.sqrt(moveX * moveX + moveY * moveY);

        if (distance < moveThreshold) {
            // Handle click
            onClick(event);
        }

        // Reset mouseDown flag
        mouseDown = false;
    }
}

function clickedObjectParent(clicked, modelRoot, container_Id) {
    // find highest ancestor under modelRoot (so we get the logical parent/group that contains the clicked mesh)
    let clickedParent = clicked;
    while (clickedParent.parent && clickedParent.parent !== modelRoot.children[0]) {
        clickedParent = clickedParent.parent;
    }
    // console.log('Clicked parent object:', clickedParent, clickedParent.name);
    // pass the parent/group to the animation routine
    animateHelmetToScreen(clickedParent, container_Id);

}

// Add this helper function to get HTML container position
function getContainerPosition(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return null

    const rect = container.getBoundingClientRect()
    const centerX = rect.left + (rect.width / 2)
    const centerY = rect.top + (rect.height / 2)

    // Convert to NDC (-1 to +1)
    const x = (centerX / window.innerWidth) * 2 - 1
    const y = -(centerY / window.innerHeight) * 2 + 1

    // Convert to world coordinates
    const vector = new THREE.Vector3(x, y, -1)
    vector.unproject(camera)

    // Calculate direction and final position
    const direction = vector.sub(camera.position).normalize()
    const distance = 2 // Distance from camera
    const targetPosition = camera.position.clone().add(direction.multiplyScalar(distance))

    return targetPosition
}

function animateHelmetToScreen(object, container_Id) {

    // Store original transforms
    const originalPosition = object.position.clone()
    const originalRotation = object.rotation.clone()
    const originalScale = object.scale.clone()
    const originalParent = object.parent

    // Get next available container
    // const itemCount = selectedItems.size + 1
    // if (itemCount > 5) return // Max 5 items

    // const containerId = `objectItemContainer${itemCount}`
    const containerId = container_Id
    const targetPosition = getContainerPosition(containerId)
    if (!targetPosition) return

    // Create parent group
    const objectGroup = new THREE.Group()
    scene.add(objectGroup)
    objectGroup.position.copy(object.getWorldPosition(new THREE.Vector3()))
    objectGroup.quaternion.copy(object.getWorldQuaternion(new THREE.Quaternion()))

    // Reparent object
    objectGroup.add(object)
    object.position.set(0, 0, 0)

    // Store for reset
    selectedItems.add({
        object: object,
        group: objectGroup,
        containerId: containerId,
        originalPosition: originalPosition,
        originalRotation: originalRotation,
        originalScale: originalScale,
        originalParent: originalParent
    })

    if (!Global.timeUp) {
        Global.score = selectedItems.size
        document.querySelector(".scoreText").innerHTML = `${Global.score.toString()}/5`
    }
    if (Global.score == 5 && !Global.timeUp) {
        Global.timeUp = true;
        Global.gameStarted = false;
        choice.batting = false;
        choice.bowling = false;
        Global.deviceOrientationAvailable = false;
        controls.enabled = false;
        usingPointerRotation = false;
        // Global.autoRotate = true;
    }



    // Animate to container position
    gsap.to(objectGroup.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: function () {
            if (this.progress() >= 0.7) { // When animation is 90% complete
                if (!this.effectsTriggered) { // Prevent multiple triggers
                    this.effectsTriggered = true;
                    createSmokeExplosion(containerId);
                    object.visible = false;
                    const imgSrc = document.querySelector(`#${containerId} .objectImg`).src;
                    const imgName = imgSrc.split('/').pop();
                    const cleanedName = imgName.replace(/B(?=\.|$)/i, '');
                    const imgEl = document.querySelector(`#${containerId} .objectImg`);
                    if (imgEl) imgEl.src = './UI/' + cleanedName;
                }
            }
        }
    })

    // Rotate to face camera
    gsap.to(object.rotation, {
        x: 0,
        y: Math.PI,
        z: 0,
        duration: 1.2,
        ease: "power2.out"
    })

    // Scale animation
    gsap.to(object.scale, {
        x: originalScale.x * 0.2, // Adjust scale to fit containers
        y: originalScale.y * 0.2,
        z: originalScale.z * 0.2,
        duration: 1.2,
        ease: "power2.out"
    })
}



// Update reset function
function resetAllItems() {
    selectedItems.forEach(item => {
        gsap.to(item.object.position, {
            x: item.originalPosition.x,
            y: item.originalPosition.y,
            z: item.originalPosition.z,
            duration: 1.2,
            ease: "power2.inOut"
        })

        gsap.to(item.object.rotation, {
            x: item.originalRotation.x,
            y: item.originalRotation.y,
            z: item.originalRotation.z,
            duration: 1.2,
            ease: "power2.inOut"
        })

        gsap.to(item.object.scale, {
            x: item.originalScale.x,
            y: item.originalScale.y,
            z: item.originalScale.z,
            duration: 1.2,
            ease: "power2.inOut",
            onComplete: () => {
                item.originalParent.add(item.object)
                item.object.position.copy(item.originalPosition)
                item.object.rotation.copy(item.originalRotation)
                scene.remove(item.group)
            }
        })
    })

    selectedItems.clear()
}

window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


var deviceControl = null;

export function onGyroPermissionUpdated() {
    Global.gameStarted = true;
    if (Global.deviceOrientationAvailable && Global.isMobile) {

        Global.autoRotate = false;
        gsap.to(modelRoot.rotation, {
            x: initialRotation.x,
            y: initialRotation.y,
            z: initialRotation.z,
            duration: 1,
            ease: "power2.out",
            onComplete: () => {
                deviceControl = orientationControl(camera);
            }
        });

    }
}


export function enablePointerRotation() {
    Global.gameStarted = true;

    if (!Global.gameStarted) return;
    // if (modelRoot) targetRotation.copy(modelRoot.rotation)

    Global.autoRotate = false;
    gsap.to(modelRoot.rotation, {
        x: initialRotation.x,
        y: initialRotation.y,
        z: initialRotation.z,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
            controls.enabled = true
            usingPointerRotation = true
        }
    });

    return;
}

var remainingTime;
var timeLessThanTen = true;
function setTime(currentTime) {
    if (Global.timeUp) return;
    const timeText = document.querySelector('.timeText');

    if (startTime < 0) startTime = currentTime;
    elapsedTime = Math.floor(currentTime - startTime);
    remainingTime = Math.max(timerDuration - elapsedTime, 0);

    timeText.innerHTML = remainingTime.toString();

    if (remainingTime <= 10) {
        if (timeLessThanTen) {
            timeLessThanTen = false;
            document.querySelector('.RedTimerImg').style.display = "block";

            gsap.fromTo(".timerContainer",
                { scale: 1 },
                {
                    scale: 1.15,
                    duration: 0.4,
                    repeat: -1,
                    yoyo: true,
                    ease: "power2.inOut"
                }
            );

            // ROTATION shake (from -4° to +4°)
            gsap.fromTo(".timerContainer",
                { rotation: -4 },
                {
                    rotation: 4,
                    duration: 0.2,
                    repeat: -1,
                    yoyo: true,
                    ease: "none"
                }
            );
        }
    }
    if (remainingTime <= 0) {
        Global.timeUp = true;
        Global.gameStarted = false;
        controls.enabled = false;
        usingPointerRotation = false;
        // Global.autoRotate = true;

        gameOver();

    }
}

// Animation loop
function animate() {

    if (!Global.timeUp && Global.gameStarted) {
        currentTime = clock.getElapsedTime()
        setTime(currentTime)
    }


    if (Global.deviceOrientationAvailable && Global.isMobile && deviceControl) {
        deviceControl.update();
    }
    if (usingPointerRotation == true && modelRoot) {
        controls.update()

        modelRoot.rotation.x += (targetRotation.x - modelRoot.rotation.x) * lerpFactor
        modelRoot.rotation.y += (targetRotation.y - modelRoot.rotation.y) * lerpFactor
        modelRoot.rotation.z += (targetRotation.z - modelRoot.rotation.z) * lerpFactor

    }

    if (modelRoot && Global.autoRotate) {
        modelRoot.rotation.y += 0.002; // slow rotation
    }


    renderer.render(scene, camera)
    requestAnimationFrame(animate)
    // stats.begin();
    // stats.end();
}
animate()



