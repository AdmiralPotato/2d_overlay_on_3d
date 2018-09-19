const atomGeometry = new THREE.IcosahedronGeometry(1, 1)
const instructionHandlers = {
  // atom
  '16': (args, data) => {
    if(args[0] !== 'M'){
      data.atoms.push({
        vector: new THREE.Vector3(
          parseFloat(args[0]),
          parseFloat(args[1]),
          parseFloat(args[2])
        ),
        symbol: args[3]
      })
    }
  },
  // bond
  '7': (args, data) => {
    if(args[0] !== 'M'){
      data.bonds.push({
        a: parseInt(args[0]) - 1,
        b: parseInt(args[1]) - 1,
        bonds: parseInt(args[2])
      })
    }
  }
}

const sdfTextToThreeSnatom = (sdfText, atomDataMap, rotation) => {
  let data = {
    atoms: [],
    bonds: [],
    maxBondLength: -Infinity,
    minBondLength: Infinity,
    bounds: new THREE.Box3()
  }
  let model = new THREE.Group()
  let molecule = new THREE.Group()
  const instructions = sdfText.split('M  END').shift().split('\n')
  instructions.forEach((instructionLine) => {
    const args = instructionLine
      .replace(/[ \t]+/g, ' ')
      .replace(/^ /, '')
      .split(' ')
    const instrunctionHandler = instructionHandlers[args.length.toString()]
    if (instrunctionHandler) {
      instrunctionHandler(args, data)
    }
  })
  data.bonds.forEach((bond) => {
    const atomA = data.atoms[bond.a]
    const atomB = data.atoms[bond.b]
    bond.length = atomA.vector.distanceTo(atomB.vector)
    data.maxBondLength = Math.max(data.maxBondLength, bond.length)
    data.minBondLength = Math.min(data.minBondLength, bond.length)
  })
  const baseAtomScale = ((data.maxBondLength - data.minBondLength) * 0.5) + data.minBondLength * 0.6
  data.atoms.forEach((atom) => {
    const atomData = atomDataMap[atom.symbol.toLocaleLowerCase()]
    if(!atomData) {
      console.error('Could not find material for: ', atom.symbol)
    }
    let ball = new THREE.Mesh(atomGeometry, atomData.material)
    ball.position.add(atom.vector)
    ball.castShadow = ball.receiveShadow = true
    ball.scale.multiplyScalar(baseAtomScale * atomData.scale)
    molecule.add(ball)
  })
  data.bounds.expandByObject(molecule)
  molecule.scale.multiplyScalar(1 / baseAtomScale)
  if (rotation) {
    molecule.rotation.copy(rotation)
  }
  // console.log(data)
  model.add(molecule)
  return {
    data,
    model
  }
}
