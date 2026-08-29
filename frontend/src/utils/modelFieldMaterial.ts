import * as THREE from 'three'

/** Buffer attribute name for per-vertex field visibility (0 = transparent, 1 = visible). */
export const CELL_ALPHA_ATTR = 'cellAlpha'

/** Shader material: vertex colors modulated by per-vertex alpha (land / invalid cells). */
export function createModelFieldMaterial(opacity = 0.82): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      opacity: { value: opacity },
    },
    vertexShader: `
      attribute vec3 color;
      attribute float ${CELL_ALPHA_ATTR};
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vAlpha = ${CELL_ALPHA_ATTR};
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float opacity;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.01) discard;
        gl_FragColor = vec4(vColor, vAlpha * opacity);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
}

export function setModelFieldOpacity(material: THREE.Material, opacity: number): void {
  if (material instanceof THREE.ShaderMaterial && material.uniforms.opacity) {
    material.uniforms.opacity.value = opacity
  }
}
