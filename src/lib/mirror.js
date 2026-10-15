/**
 * mirror.js — a soft, glossy reflection for the polished resin court.
 *
 * This is three.js' `Reflector` idea (mirrored virtual camera + oblique
 * near-plane clipping, MIT © three.js authors) rewritten for architectural
 * use:
 *
 *  · it is a *blend*, not an opaque mirror — the LED floor keeps showing
 *    through, which is what makes polished resin read as resin;
 *  · the reflection is weighted by a fresnel term, so it is strongest at
 *    grazing angles and almost gone underfoot;
 *  · a micro-ripple distorts the projected lookup, so the surface reads as
 *    slightly wavy resin instead of a perfect chrome plate;
 *  · the mirror pass only renders the objects tagged onto `layer`, so the
 *    cost is a handful of meshes rather than a second pass over the whole
 *    1 700-mesh complex.
 */
import * as THREE from "three";

const MIRROR_VERTEX = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vProjected;
  varying vec3 vWorld;
  void main() {
    vProjected = textureMatrix * vec4(position, 1.0);
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MIRROR_FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform float uRipple;
  uniform float uTime;
  varying vec4 vProjected;
  varying vec3 vWorld;

  void main() {
    vec3 toEye = normalize(cameraPosition - vWorld);

    // grazing angles reflect more than the surface straight below the eye
    float fresnel = pow(1.0 - clamp(toEye.y, 0.0, 1.0), 2.4);

    // resin micro-ripple: sub-pixel wobble, two frequencies
    vec2 wobble = vec2(
      sin(vWorld.z * 3.1 + uTime * 0.7),
      cos(vWorld.x * 2.7 - uTime * 0.5)
    ) * 0.0018 * uRipple;

    vec4 projected = vProjected;
    projected.xy += wobble * projected.w;
    vec3 reflected = texture2DProj(tDiffuse, projected).rgb;

    // where the mirrored camera saw empty space there is nothing to reflect,
    // so weight the blend by how much light actually came back: a dark hall
    // must not dump a flat grey veil over the LED floor
    float luminance = dot(reflected, vec3(0.299, 0.587, 0.114));
    float weight = clamp(luminance * 1.7, 0.0, 1.0);

    float alpha = uOpacity * (0.16 + 0.84 * fresnel) * (0.28 + 0.72 * weight);
    gl_FragColor = vec4(reflected * uTint, alpha);
  }
`;

export class ResinMirror extends THREE.Mesh {
  /**
   * @param {THREE.BufferGeometry} geometry  the surface that mirrors.
   * @param {object} options
   * @param {number} options.opacity     reflection strength at grazing angles.
   * @param {number} options.layer       the only layer the mirror pass renders.
   * @param {number} options.resolution  reflection render-target size.
   */
  constructor(geometry, options = {}) {
    super(geometry);

    this.isResinMirror = true;
    this.type = "ResinMirror";

    const {
      opacity = 0.44,
      tint = 0xdfeeff,
      ripple = 1,
      layer = 2,
      resolution = 768,
      clipBias = 0.0035,
      multisample = 2,
    } = options;

    /** Mirrored camera. Restricted to one layer so the pass stays cheap. */
    this.camera = new THREE.PerspectiveCamera();
    this.camera.layers.set(layer);
    this.mirrorLayer = layer;

    const scope = this;
    const reflectorPlane = new THREE.Plane();
    const normal = new THREE.Vector3();
    const reflectorWorldPosition = new THREE.Vector3();
    const cameraWorldPosition = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4();
    const lookAtPosition = new THREE.Vector3(0, 0, -1);
    const clipPlane = new THREE.Vector4();
    const view = new THREE.Vector3();
    const target = new THREE.Vector3();
    const q = new THREE.Vector4();
    const textureMatrix = new THREE.Matrix4();
    const virtualCamera = this.camera;

    const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
      type: THREE.HalfFloatType,
      samples: multisample,
    });

    this.material = new THREE.ShaderMaterial({
      name: "ResinMirrorShader",
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        textureMatrix: { value: textureMatrix },
        uTint: { value: new THREE.Color(tint) },
        uOpacity: { value: opacity },
        uRipple: { value: ripple },
        uTime: { value: 0 },
      },
      vertexShader: MIRROR_VERTEX,
      fragmentShader: MIRROR_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      fog: false,
    });

    // draw after the rest of the transparency, so the floor layers beneath
    // (LED film, sensor print) have already landed in the frame buffer
    this.renderOrder = 12;
    this.receiveShadow = false;

    this.onBeforeRender = function (renderer, scene, camera) {
      if (!scope.visible) return;

      reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
      rotationMatrix.extractRotation(scope.matrixWorld);

      normal.set(0, 0, 1).applyMatrix4(rotationMatrix);

      view.subVectors(reflectorWorldPosition, cameraWorldPosition);
      // facing away from the surface: nothing to mirror
      if (view.dot(normal) > 0) return;

      view.reflect(normal).negate();
      view.add(reflectorWorldPosition);

      rotationMatrix.extractRotation(camera.matrixWorld);
      lookAtPosition.set(0, 0, -1).applyMatrix4(rotationMatrix).add(cameraWorldPosition);

      target.subVectors(reflectorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorldPosition);

      virtualCamera.position.copy(view);
      virtualCamera.up.set(0, 1, 0).applyMatrix4(rotationMatrix).reflect(normal);
      virtualCamera.lookAt(target);
      virtualCamera.far = camera.far;
      virtualCamera.updateMatrixWorld();
      virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

      // clip-space -> texture-space matrix for the projected lookup
      textureMatrix.set(
        0.5, 0.0, 0.0, 0.5,
        0.0, 0.5, 0.0, 0.5,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
      );
      textureMatrix.multiply(virtualCamera.projectionMatrix);
      textureMatrix.multiply(virtualCamera.matrixWorldInverse);
      textureMatrix.multiply(scope.matrixWorld);

      // oblique near plane (Lengyel): clip everything behind the surface
      reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
      reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);
      clipPlane.set(
        reflectorPlane.normal.x,
        reflectorPlane.normal.y,
        reflectorPlane.normal.z,
        reflectorPlane.constant
      );

      const projectionMatrix = virtualCamera.projectionMatrix;
      q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
      q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
      q.z = -1.0;
      q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
      projectionMatrix.elements[14] = clipPlane.w;

      // render the tagged layer from the mirrored camera
      scope.visible = false;
      const currentRenderTarget = renderer.getRenderTarget();
      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
      const currentClearAlpha = renderer.getClearAlpha();
      const currentClearColor = renderer.getClearColor(new THREE.Color());

      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(renderTarget);
      renderer.setClearColor(0x000000, 0); // empty reflection: sky stays out
      renderer.state.buffers.depth.setMask(true);
      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, virtualCamera);

      renderer.setClearColor(currentClearColor, currentClearAlpha);
      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
      renderer.setRenderTarget(currentRenderTarget);
      if (camera.viewport !== undefined) renderer.state.viewport(camera.viewport);
      scope.visible = true;
    };

    this.dispose = function () {
      renderTarget.dispose();
      scope.material.dispose();
      scope.geometry.dispose();
    };
  }

  /** Per-frame ripple time. */
  update(elapsed) {
    this.material.uniforms.uTime.value = elapsed;
  }

  setOpacity(value) {
    this.material.uniforms.uOpacity.value = value;
  }
}

/**
 * Court-sized mirror plate, sitting just above the resin.
 * @returns {{mesh: ResinMirror, tags: Function}}
 */
export function createCourtMirror({ length = 28, width = 15, layer = 2, opacity = 0.44, resolution = 768 }) {
  const mesh = new ResinMirror(new THREE.PlaneGeometry(length, width), { layer, opacity, resolution });
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.045; // over the LED film, under the athletes
  mesh.name = "courtMirror";
  mesh.visible = false; // opt-in: the HUD chip (or the film) switches it on

  /** Put objects into the reflection without changing how the main pass draws them. */
  const tags = (objects) => {
    const list = Array.isArray(objects) ? objects : [objects];
    list.forEach((object) => {
      object?.traverse?.((child) => child.layers.enable(layer));
    });
    return list.length;
  };

  return { mesh, tags };
}
