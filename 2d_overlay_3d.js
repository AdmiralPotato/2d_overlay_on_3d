const canvas = document.getElementById('3d')
const svg = document.getElementById('2d')
const xmlns = svg.getAttribute('xmlns')
const xlinkns = 'http://www.w3.org/1999/xlink';
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
scene.fog = new THREE.Fog('#262626', 7, 9)

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
const start = async () => {
  await makeObjects()
  requestAnimationFrame(loop)
}

const vector = new THREE.Vector3()
const getScreenXY = (object) => {
  vector.setFromMatrixPosition(object.matrixWorld)
  vector.project(camera);

  return new THREE.Vector3(
    ((( vector.x + 1 ) * 0.5)) * width,
    (1 - (( vector.y + 1 ) * 0.5)) * height,
    (( vector.z + 1 ) * 0.5) * square
  )
}

// now to get creative

const defs = document.createElementNS(xmlns, 'defs')
const overlayDef = document.createElementNS(xmlns, 'g')
const circle = document.createElementNS(xmlns, 'circle')
const line = document.createElementNS(xmlns, 'path')
overlayDef.setAttributeNS(null, 'id', 'overlay')
circle.setAttributeNS(null, 'class', 'stroke')
line.setAttributeNS(null, 'class', 'stroke')
overlayDef.appendChild(circle)
overlayDef.appendChild(line)
defs.appendChild(overlayDef)
svg.appendChild(defs)

let circleRadius
let fontSize
const reziseDefs = () => {
  const strokeWidth = '' + (square / 300)
  circleRadius = square / 15
  fontSize = (circleRadius * 0.35) + 'px'
  const lsa = circleRadius * 0.575
  const lsb = circleRadius * 0.525
  circle.setAttributeNS(null, 'r', circleRadius)
  line.setAttributeNS(null, 'd', `
    M-${lsa},-${lsa} L-${lsb},-${lsb}Z
    M${lsa},-${lsa} L${lsb},-${lsb}Z
    M-${lsa},${lsa} L-${lsb},${lsb}Z
    M${lsa},${lsa} L${lsb},${lsb}Z
  `)
  document.querySelectorAll('.stroke').forEach((element) => {
    element.setAttributeNS(null, 'stroke-width', strokeWidth)
  })
}

const materialBase = {metalness: 0.1, roughness: 0.5}
const atomDataMap = {
  h: {scale: 0.5, material: new THREE.MeshStandardMaterial(Object.assign({color: '#b1cbbf'}, materialBase))},
  c: {scale: 1.0, material: new THREE.MeshStandardMaterial(Object.assign({color: '#425d61'}, materialBase))},
  o: {scale: 1.1, material: new THREE.MeshStandardMaterial(Object.assign({color: '#c41715'}, materialBase))},
  n: {scale: 1.1, material: new THREE.MeshStandardMaterial(Object.assign({color: '#0b5366'}, materialBase))},
  cl: {scale: 1.2, material: new THREE.MeshStandardMaterial(Object.assign({color: '#216359'}, materialBase))},
  na: {scale: 1.2, material: new THREE.MeshStandardMaterial(Object.assign({color: '#474a9c'}, materialBase))},
}
const molecules = [
  {name: 'Sucrose', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5988/sdf?record_type=3d'},
  {name: 'Nicotine', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/89594/sdf?record_type=3d'},
  {name: 'Cholesterol', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5997/sdf?record_type=3d', rotation: new THREE.Euler(0, 0, -Math.PI / 2)},
  {name: 'Methylphenidate', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4158/sdf?record_type=3d'},
  {name: 'Salt', path: 'https://cactus.nci.nih.gov/chemical/structure/[Cl-][Na+]/file?format=sdf&get3d=True'},
  {name: 'Alcohol', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5798/sdf?record_type=3d'},
  {name: 'THC', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/16078/sdf?record_type=3d'},
  {name: 'Caffeine', path: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2519/sdf?record_type=3d'}
]

let objects = []
const completeSets = 2
const makeObjects = () => {
  molecules.forEach((molecule) => {
    molecule.sdfText = sdfData[molecule.path]
    const parsedMolecule = sdfTextToThreeSnatom(molecule.sdfText, atomDataMap, molecule.rotation)
    molecule.data = parsedMolecule.data
    molecule.model = parsedMolecule.model
  })
  let moleculeScale = -Infinity
  let moleculeScaleVector = new THREE.Vector3()
  molecules.forEach((molecule) => {
    molecule.data.bounds.getSize(moleculeScaleVector)
    moleculeScale = Math.max(moleculeScale, moleculeScaleVector.length())
    molecule.model.children[0].position.sub(
      molecule.data.bounds.getCenter(moleculeScaleVector)
    )
  })
  for (let i = 0; i < molecules.length * completeSets; i++) {
    const moleculeIndex = i % molecules.length
    const pivotA = new THREE.Group()
    const pivotB = new THREE.Group()
    const molecule = molecules[moleculeIndex].model.clone(true)
    const overlay = document.createElementNS(xmlns, 'g')
    const use = document.createElementNS(xmlns, 'use')
    const text = document.createElementNS(xmlns, 'text')
    const line = document.createElementNS(xmlns, 'path')
    pivotA.position.x = 1.25
    molecule.scale.multiplyScalar(1 / moleculeScale)
    molecule.position.x = 0.75
    pivotA.add(molecule)
    pivotB.add(pivotA)
    group.add(pivotB)
    use.setAttributeNS(xlinkns, 'xlink:href', '#overlay')
    text.setAttributeNS(null, 'class', 'text')
    text.setAttributeNS(null, 'text-anchor', 'middle')
    text.setAttributeNS(null, 'alignment-baseline', 'central')
    line.setAttributeNS(null, 'class', 'stroke')
    text.textContent = molecules[moleculeIndex].name
    overlay.appendChild(use)
    overlay.appendChild(text)
    overlay.appendChild(line)
    svg.appendChild(overlay)

    objects.push({
      pivotA,
      pivotB,
      molecule,
      line,
      use,
      text,
      overlay
    })
  }
}

const loopDuration = 20
const tau = Math.PI * 2
const diff = new THREE.Vector2()
const pointA = new THREE.Vector2()
const pointB = new THREE.Vector2()
const pointC = new THREE.Vector2()
const rotatedRadius = new THREE.Vector2()
const circleRadiusVector = new THREE.Vector2()
const emptyVector = new THREE.Vector2(0, 0)
const clamp = (n) => { return Math.min(Math.max(0, n), 1) }
const animate = (time) => {
  const phase = time / 1000 / loopDuration / completeSets
  const objectFrac = 1 / objects.length
  // 3D loop
  objects.forEach((object, index) => {
    const frac = index * objectFrac
    object.pivotB.rotation.z = ((phase * completeSets) + 0.5 + frac) * tau
    object.pivotA.rotation.y = (phase + frac) * tau * 4
    object.molecule.rotation.z = (phase + frac) * tau * -2
  })
  renderer.render(scene, camera)
  // 2D loop needs to be run after the 3D render so all matrices are "baked"
  circleRadiusVector.set(circleRadius, 0)
  objects.forEach((object) => {
    const position = getScreenXY(object.molecule)
    diff.copy(position).sub(center)
    const angle = diff.angle()
    rotatedRadius.copy(circleRadiusVector).rotateAround(emptyVector, angle)
    pointA.copy(rotatedRadius).multiplyScalar(1.000)
    pointB.copy(rotatedRadius).multiplyScalar(1.500)
    pointC.copy(rotatedRadius).multiplyScalar(2.000)
    object.line.setAttributeNS(null, 'd', `M${pointA.x},${pointA.y} L${pointB.x},${pointB.y}Z`)
    object.use.setAttributeNS(null, 'transform', `rotate(${-(angle / deg) * 2})`)
    object.overlay.setAttributeNS(null, 'opacity', `${1 - clamp(((position.z / square) - 0.9863) * 1000) }`)
    object.overlay.setAttributeNS(null, 'transform', `translate(${position.x}, ${position.y})`)
    object.text.setAttributeNS(null, 'x', pointC.x)
    object.text.setAttributeNS(null, 'y', pointC.y)
    object.text.style.setProperty('font-size', fontSize)
  })
}

start()