import { inferNode } from '../src/core/infer'
import { generateTypeScript } from '../src/generators/typescript'
import { generateRust } from '../src/generators/rust'
import { generateGo } from '../src/generators/go'
import { generateJava } from '../src/generators/java'
import { generateZod } from '../src/generators/zod'
import { generateOpenAPI } from '../src/generators/openapi'

const input = {
  id: 1,
  name: 'Alice',
  active: true,
  score: 9.5,
  tags: ['admin', 'user'],
  address: { city: 'Berlin', zip: '10115' },
  nickname: null,
}

const node = inferNode(input)

console.log('===TS===')
console.log(generateTypeScript(node))
console.log('===RUST===')
console.log(generateRust(node))
console.log('===GO===')
console.log(generateGo(node))
console.log('===JAVA===')
console.log(generateJava(node))
console.log('===ZOD===')
console.log(generateZod(node))
console.log('===OPENAPI===')
console.log(generateOpenAPI(node))
