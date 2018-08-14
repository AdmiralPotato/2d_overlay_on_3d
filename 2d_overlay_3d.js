const canvas = document.getElementById('3d')
const svg = document.getElementById('2d')
const xmlns = svg.getAttribute('xmlns')
const xlinkns = "http://www.w3.org/1999/xlink";
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
let center = new THREE.Vector2()
const deg = Math.PI / 180
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
    ) / deg
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(dpr)
    renderer.setSize(
      clientWidth,
      clientHeight,
      false
    )
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    center.set(width / 2, height / 2)
    reziseDefs()
  }
}

let go = true
const loop = (time) => {
  if (go) {
    requestAnimationFrame(loop)
    resize()
    animate(time)
  }
}
const start = () => {
  requestAnimationFrame(loop)
}

const vector = new THREE.Vector3()
const getScreenXY = (object) => {
  vector.setFromMatrixPosition(object.matrixWorld)
  vector.project(camera);

  return new THREE.Vector2(
    (1 - (( vector.x + 1 ) * 0.5)) * width,
    ((( vector.y + 1 ) * 0.5)) * height
  )
}

// now to get creative

const defs = document.createElementNS(xmlns, 'defs')
const overlayDef = document.createElementNS(xmlns, 'g')
const circle = document.createElementNS(xmlns, 'circle')
const line = document.createElementNS(xmlns, 'path')
const miscLines = document.createElementNS(xmlns, 'path')
miscLines.setAttributeNS(null, 'class', 'stroke')
overlayDef.setAttributeNS(null, 'id', 'overlay')
circle.setAttributeNS(null, 'class', 'stroke')
line.setAttributeNS(null, 'class', 'stroke')
overlayDef.appendChild(circle)
overlayDef.appendChild(line)
defs.appendChild(overlayDef)
svg.appendChild(defs)

let circleRadius
const reziseDefs = () => {
  const strokeWidth = '' + (square / 150)
  circleRadius = square / 16
  const lsa = circleRadius * 0.575
  const lsb = circleRadius * 0.525
  circle.setAttributeNS(null, 'r', circleRadius)
  circle.setAttributeNS(null, 'stroke-width', strokeWidth)
  line.setAttributeNS(null, 'stroke-width', strokeWidth)
  line.setAttributeNS(null, 'd', `
    M-${lsa},-${lsa} L-${lsb},-${lsb}Z
    M${lsa},-${lsa} L${lsb},-${lsb}Z
    M-${lsa},${lsa} L-${lsb},${lsb}Z
    M${lsa},${lsa} L${lsb},${lsb}Z
  `)
  miscLines.setAttributeNS(null, 'stroke-width', strokeWidth)
}

const geometry = new THREE.DodecahedronGeometry(0.25, 0)
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
svg.appendChild(miscLines)
for (let i = 0; i < mats.length * completeSets; i++) {
  const pivotA = new THREE.Group()
  const pivotB = new THREE.Group()
  const shape = new THREE.Mesh(geometry, mats[i % mats.length])
  const overlay = document.createElementNS(xmlns, 'g')
  const use = document.createElementNS(xmlns, 'use')
  const text = document.createElementNS(xmlns, 'text')
  pivotA.position.x = 1.75
  shape.position.x = 0.375
  shape.castShadow = shape.receiveShadow = true
  pivotA.add(shape)
  pivotB.add(pivotA)
  group.add(pivotB)
  use.setAttributeNS(xlinkns, 'xlink:href', '#overlay')
  text.setAttributeNS(null, 'class', 'text')
  text.setAttributeNS(null, 'text-anchor', 'middle')
  text.setAttributeNS(null, 'alignment-baseline', 'central')
  text.textContent = i % mats.length
  overlay.appendChild(use)
  overlay.appendChild(text)
  svg.appendChild(overlay)

  objects.push({
    pivotA,
    pivotB,
    shape,
    use,
    text,
    overlay
  })
}

const loopDuration = 4
const tau = Math.PI * 2
const diff = new THREE.Vector2()
const pointA = new THREE.Vector2()
const pointB = new THREE.Vector2()
const pointC = new THREE.Vector2()
const rotatedRadius = new THREE.Vector2()
const circleRadiusVector = new THREE.Vector2()
const emptyVector = new THREE.Vector2(0, 0,)
const animate = (time) => {
  const phase = time / 1000 / loopDuration / completeSets
  const objectFrac = 1 / objects.length
  // 3D loop
  objects.forEach((object, index) => {
    const frac = index * objectFrac
    object.pivotB.rotation.z = (phase + frac) * tau
    object.pivotA.rotation.y = (phase + frac) * tau * 6
    object.shape.rotation.y = (phase + frac) * tau * 4
  })
  renderer.render(scene, camera)
  // 2D loop needs to be run after the 3D render so all matrices are "baked"
  const lineInstructions = []
  circleRadiusVector.set(circleRadius, 0)
  objects.forEach((object) => {
    const position = getScreenXY(object.shape)
    diff.copy(position).sub(center)
    const angle = diff.angle()
    rotatedRadius.copy(circleRadiusVector).rotateAround(emptyVector, angle)
    pointA.copy(rotatedRadius).multiplyScalar(1.250).add(diff).add(center)
    pointB.copy(rotatedRadius).multiplyScalar(1.500).add(diff).add(center)
    pointC.copy(rotatedRadius).multiplyScalar(2.000)
    lineInstructions.push(
      `M${pointA.x},${pointA.y} L${pointB.x},${pointB.y}Z`,
    )
    object.use.setAttributeNS(null, 'transform', `rotate(${-(angle / deg) * 2})`)
    object.overlay.setAttributeNS(null, 'transform', `translate(${position.x}, ${position.y})`)
    object.text.setAttributeNS(null, 'x', pointC.x)
    object.text.setAttributeNS(null, 'y', pointC.y)
    object.text.style.setProperty('font-size', '' + (circleRadius * 0.75))
  })
  miscLines.setAttributeNS(null, 'd', lineInstructions.join(' '))
}

start()