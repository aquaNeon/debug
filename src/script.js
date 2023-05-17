import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/flies/vertex.glsl'
import firefliesFragmentShader from './shaders/flies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'


// To the one reading this: thank you! 

// Debug 
const debugObject = {}

// // gui deactivated
// const gui = new dat.GUI({
//     width: 200
// })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const fog = new THREE.Fog('#0a0b24', 1,15)
scene.fog = fog

// __________________________________________


/**
 * Loaders
 */

const loadingBarElement = document.querySelector('.loading-bar')

let loaded = false  // My Attempt to condition the z-position of camera 

const loadingManager = new THREE.LoadingManager(
    () =>
    {
        gsap.delayedCall(0.5, () =>
        {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 })
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        })

    },

    (itemUrl, itemsLoaded, itemsTotal) =>
    {
        const progressRatio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio})`

        if(progressRatio === 1)
        {
        loaded = true
            
        }
        
    }
)

const textureLoader = new THREE.TextureLoader(loadingManager)
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('draco/')
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)


// _________________________________________

// LOADING SCREEN 

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms:
    {
        uAlpha: { value: 1 }
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.1, 0.0, 0.2, uAlpha);
        }
    `
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

//___________________________________________

const parameters = {
    materialColor: '#e2b8ff'
}

// __________________________________________


// Textures 

const bakedTexture = textureLoader.load('baked2.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace


const gradientTexture = textureLoader.load('textures/gradients/3.jpg')
gradientTexture.magFilter = THREE.NearestFilter

// Material
const material = new THREE.MeshToonMaterial({
    color: parameters.materialColor,
    gradientMap: gradientTexture
})

const material2 = new THREE.MeshToonMaterial({
    color: parameters.materialColor,
    gradientMap: gradientTexture,
    wireframe: true
})

// Objects
const objectsDistance = 4
const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
)
const mesh4 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    material2
)

mesh1.position.x = 3
mesh2.position.x = -3
mesh3.position.x = 3
mesh4.position.x = -3

mesh1.position.z = -10
mesh2.position.z = -15
mesh3.position.z = -20
mesh4.position.z = -25

scene.add(mesh1, mesh2, mesh3, mesh4)
const sectionMeshes = [ mesh1, mesh2, mesh3, mesh4 ]

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })


 // ___________________________________________________________

// Lights & Shaders  

debugObject.portalColorStart = '#fbbcc5'
debugObject.portalColorEnd = '#0a0b24'


const smallLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5} )
const bottomMaterial = new THREE.MeshBasicMaterial({ color: 0x08091b} )

const portalMaterial = new THREE.ShaderMaterial({
    uniforms: 
    {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },

    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
} )


// _________________________________________

/**
 * Particles Background
 */
const particlesCount = 2000
const positions = new Float32Array(particlesCount * 3)

for(let i = 0; i < particlesCount; i++)
{
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length
    positions[i * 3 + 2] = (Math.random() - 0.5) * 250
}

const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

// Material
const particlesMaterial = new THREE.PointsMaterial({
    color: parameters.materialColor,
    sizeAttenuation: textureLoader,
    size: 0.03
})

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)


// Model 

gltfLoader.load(
    'protal_bottom.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
        {
            child.material = bakedMaterial
        })
        scene.add(gltf.scene)
        gltf.scene.position.set(0,-1,-30)

        // Get each object
        const portalLightMesh = gltf.scene.children.find((child) => child.name === 'portal')
        const poleLightAMesh = gltf.scene.children.find((child) => child.name === 'poleLightA')
        const poleLightBMesh = gltf.scene.children.find((child) => child.name === 'poleLightB')
        const poleLightCMesh = gltf.scene.children.find((child) => child.name === 'poleLightC')
        const poleLightDMesh = gltf.scene.children.find((child) => child.name === 'poleLightD')
        const poleLightEMesh = gltf.scene.children.find((child) => child.name === 'poleLightE')
        const bottom = gltf.scene.children.find((child) => child.name === 'bottom')

        // Apply materials
        poleLightAMesh.material = smallLightMaterial
        poleLightBMesh.material = smallLightMaterial
        poleLightCMesh.material = smallLightMaterial
        poleLightDMesh.material = smallLightMaterial
        poleLightEMesh.material = smallLightMaterial
        poleLightEMesh.material = smallLightMaterial
        portalLightMesh.material = portalMaterial
        bottom.material = bottomMaterial
    }
)

// __________________________________________________________

// Fireflies 

// geometry 
const fliesGeometry = new THREE.BufferGeometry()
const fliesCount = 30 
const positionArray = new Float32Array(fliesCount * 3)
const scaleArray = new Float32Array(fliesCount)

for(let i =0; i < fliesCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 5
    positionArray[i * 3 + 1] = Math.random() *1.5
    positionArray[i * 3 + 2] = (Math.random() -0.5)*3.75

    scaleArray[i] = Math.random()
}


fliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
fliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

const fliesMaterial = new THREE.ShaderMaterial({
    uniforms: 
    {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 145 } // for equal pixel ratio 
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})


const flies = new THREE.Points(fliesGeometry, fliesMaterial)
scene.add(flies)
flies.position.z = -30


// _______________________________________________________________


/**
 * Size
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // update fireflies 
    fliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */


// Group
const cameraGroup = new THREE.Group()
cameraGroup.position.set(0, 0, 0) 
scene.add(cameraGroup)


// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 0) 
cameraGroup.add(camera)


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.domElement.addEventListener('click', function () {
    // Check if the sound is not already playing
    if (!sound.isPlaying) {
      sound.play();
    }
  });

debugObject.clearColor = '#0a0b24'
renderer.setClearColor(debugObject.clearColor)

// __________________________________________________________________

/**
 * Scroll
 */

let scrollY = window.scrollY
let currentSection = 0

window.addEventListener('scroll', () =>
{
    scrollY = window.scrollY
    const newSection = Math.round(scrollY / sizes.height)

    if(newSection != currentSection)
    {
        currentSection = newSection

        gsap.to(
            sectionMeshes[currentSection].rotation,
            {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=3',
                z: '+=1.5'
            }
        )
    }

    fliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Cursor
 */
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5
})


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime


    // Animate camera

    if(loaded === false)
    {
    camera.position.z = -0  // trying to force camera to start position
    console.log(camera.position.z)
    

    }
    else
    {
        camera.position.z = - scrollY / sizes.height * objectsDistance // snaps back to this position 
        console.log(camera.position.z)

    }

    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime

    // Animate meshes
    for(const mesh of sectionMeshes)
    {
        mesh.rotation.x += deltaTime * 0.1
        mesh.rotation.y += deltaTime * 0.12
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    // Time to shaders 
    portalMaterial.uniforms.uTime.value = elapsedTime // needed to be first to work - why? 
    fliesMaterial.uniforms.uTime.value = elapsedTime


}

tick()