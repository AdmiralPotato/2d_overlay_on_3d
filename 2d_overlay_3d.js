const canvas = document.getElementById('3d')
const svg = document.getElementById('2d')
const xmlns = svg.getAttribute('xmlns')
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
})
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
)
const scene = new THREE.Scene()
const group = new THREE.Group()
scene.add(group)

const directionalLight = new THREE.DirectionalLight(0xffffff, .5)
directionalLight.position.set(-2, 2, 2)
directionalLight.castShadow = true
scene.add(directionalLight)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, .5)
directionalLight2.position.set(1, 2, 1)
directionalLight2.castShadow = true
scene.add( directionalLight2 )

const ambientLight = new THREE.AmbientLight(0x808080, .5)
scene.add(ambientLight)

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 )
scene.add( light )

camera.position.set(0, 0, 8)
camera.lookAt(new THREE.Vector3(0,0,0))
camera.rotation.z = Math.PI
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

let width
let height
let square
const resize = () => {
  const clientWidth = canvas.clientWidth
  const clientHeight = canvas.clientHeight
  const dpr = window.devicePixelRatio
  width = clientWidth * dpr
  height = clientHeight * dpr
  square = Math.min(width, height)
  if (
    canvas.width !== width ||
    canvas.height !== height
  ) {
    const aspect = width / height
    const desiredMinimumFov = Math.PI / 4 //90 deg
    // this ensures that I always have a 90deg square in the center of both landscape and portrait viewports
    camera.fov = (
      aspect >= 1 ? desiredMinimumFov : 2 * Math.atan(Math.tan(desiredMinimumFov / 2) / aspect)
    ) / (Math.PI / 180)
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(dpr)
    renderer.setSize(
      clientWidth,
      clientHeight,
      false
    )
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
}

const loop = (time) => {
  requestAnimationFrame(loop)
  resize()
  animate(time)
}
const start = () => {
  requestAnimationFrame(loop)
}

const vector = new THREE.Vector3()
const getScreenXY = (object) => {
  vector.setFromMatrixPosition(object.matrixWorld)
  vector.project(camera);

  return {
    x: (1 - (( vector.x + 1 ) * 0.5)) * width,
    y: ((( vector.y + 1 ) * 0.5)) * height
  }
}

// now to get creative

const centerGeo = new THREE.CylinderBufferGeometry(0.25, 0.25, 0.125, 96)
const palette = ["#D4E6E0", "#EE720A", "#557E86", "#9E650F", "#475B4F", "#D8B85B"]
const mats = [
  new THREE.MeshStandardMaterial({color: palette[0], metalness: 0.1, roughness: 0.5}),
  new THREE.MeshStandardMaterial({color: palette[1], metalness: 0.1, roughness: 0.5}),
  new THREE.MeshStandardMaterial({color: palette[2], metalness: 0.1, roughness: 0.5}),
  new THREE.MeshStandardMaterial({color: palette[3], metalness: 0.1, roughness: 0.5}),
  new THREE.MeshStandardMaterial({color: palette[4], metalness: 0.1, roughness: 0.5}),
  new THREE.MeshStandardMaterial({color: palette[5], metalness: 0.1, roughness: 0.5}),
]

const completeSets = 3
let objects = []
for (let i = 0; i < mats.length * completeSets; i++) {
  const pivotA = new THREE.Group()
  const pivotB = new THREE.Group()
  const center = new THREE.Mesh(centerGeo, mats[i % mats.length])
  const circle = document.createElementNS(xmlns, 'circle')
  pivotA.position.y = 2
  center.position.y = 0.5
  center.castShadow = center.receiveShadow = true
  pivotA.add(center)
  pivotB.add(pivotA)
  group.add(pivotB)
  circle.setAttributeNS(null, 'class', 'stroke')
  svg.appendChild(circle)

  objects.push({
    pivotA,
    pivotB,
    center,
    circle
  })
}

const loopDuration = 4
const tau = Math.PI * 2
const animate = (time) => {
  const phase = time / 1000 / loopDuration / completeSets
  const objectFrac = 1 / objects.length
  // 3D loop
  objects.forEach((object, index) => {
    const frac = index * objectFrac
    object.pivotB.rotation.z = (phase + frac) * tau
    object.pivotA.rotation.x = (phase + frac) * tau * 6
    object.center.rotation.x = (phase + frac) * tau * 4
  })
  renderer.render(scene, camera)
  // 2D loop needs to be run after the 3D render so all matrices are "baked"
  objects.forEach((object, index) => {
    const position = getScreenXY(object.center)
    object.circle.setAttributeNS(null, 'cx', '' + position.x)
    object.circle.setAttributeNS(null, 'cy', '' + position.y)
    object.circle.setAttributeNS(null, 'r', '' + (square / 15))
    object.circle.setAttributeNS(null, 'stroke-width', '' + (square / 150))
  })
}

start()