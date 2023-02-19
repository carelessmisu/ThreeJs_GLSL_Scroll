import * as THREE from "three";
import vertexShader from "./glsl/vertexShader.glsl";
import fragmentShader from "./glsl/fragmentShader.glsl";
import "../sass/style.scss";


const canvasEl = document.getElementById('webgl-canvas');
const canvasSize = {
  w: window.innerWidth,
  h: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({ canvas: canvasEl as HTMLCanvasElement });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvasSize.w, canvasSize.h);

// ウィンドウとwebGLの座標を一致させるため、描画がウィンドウぴったりになるようカメラを調整
const fov = 60; // 視野角
const fovRad = (fov / 2) * (Math.PI / 180);
const dist = canvasSize.h / 2 / Math.tan(fovRad);
const camera = new THREE.PerspectiveCamera(
  fov,
  canvasSize.w / canvasSize.h,
  0.1,
  1000
);
camera.position.z = dist;

// リサイズ処理
let timeoutId: number = 0;
const resize = () => {
  // three.jsのリサイズ
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvasSize.w = width;
  canvasSize.h = height;

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // カメラの距離を計算し直す
  const fov = 60;
  const fovRad = (fov / 2) * (Math.PI / 180);
  const dist = canvasSize.h / 2 / Math.tan(fovRad);
  camera.position.z = dist;
};

const scene = new THREE.Scene();

const loader = new THREE.TextureLoader();

// 画像をテクスチャにしたplaneを扱うクラス
class ImagePlane {
  refImage: HTMLImageElement;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  constructor(mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>, img: HTMLImageElement) {
    this.refImage = img;
    this.mesh = mesh;
  };

  setParams() {
    // 参照するimg要素から大きさ、位置を取得してセット
    const rect = this.refImage.getBoundingClientRect();

    this.mesh.scale.x = rect.width;
    this.mesh.scale.y = rect.height;

    const x = rect.left - canvasSize.w / 2 + rect.width / 2;
    const y = -rect.top + canvasSize.h / 2 - rect.height / 2;
    this.mesh.position.set(x, y, this.mesh.position.z);
  };

  update(offset: number) {
    this.setParams();

    this.mesh.material.uniforms.uTime.value = offset;
  };
};

const createMesh = (img: HTMLImageElement) => {
  const texture = loader.load(img.src);

  const uniforms = {
    uTexture: { value: texture },
    uImageAspect: { value: img.naturalWidth / img.naturalHeight },
    uPlaneAspect: { value: img.clientWidth / img.clientHeight },
    uTime: { value: 0 },
  };

  const geo = new THREE.PlaneGeometry(1, 1, 100, 100); // 後から画像のサイズにscaleするので1にしておく
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const mesh = new THREE.Mesh(geo, mat);

  return mesh;

};

// スクロール追従
let targetScrollY: number = 0; // 本来のスクロール位置
let currentScrollY: number = 0; // 線形補間を適用した現在のスクロール位置
let scrollOffset: number = 0; // 上記2つの差分

// 開始と終了をなめらかに補間する関数
const lerp = (start: number, end: number, multiplier: number) => {
  return (1 - multiplier) * start + multiplier * end;
};

const updateScroll = () => {
  // スクロール位置を取得
  targetScrollY = document.documentElement.scrollTop;
  // リープ関数でスクロール位置をなめらかに追従
  currentScrollY = lerp(currentScrollY, targetScrollY, 0.1);

  scrollOffset = targetScrollY - currentScrollY;
};

// 慣性スクロール
const scrollArea = document.querySelector<HTMLDivElement>('.scrollable');
// ボディの高さがなくなるのでコンテンツ分指定する
document.body.style.height = `${scrollArea!.getBoundingClientRect().height}px`;

const imagePlaneArray: ImagePlane[] = [];

// 毎フレーム呼び出す
const loop = () => {
  updateScroll();

  scrollArea!.style.transform = `translate3d(0,${-currentScrollY}px,0)`;
  for (const plane of imagePlaneArray) {
    plane.update(scrollOffset);
  }

  renderer.render(scene, camera);

  requestAnimationFrame(loop);
};

const main = () => {
  window.addEventListener('load', () => {
    const imageArray = [...document.querySelectorAll<HTMLImageElement>('img')];

    for (const img of imageArray) {
      const mesh = createMesh(img);
      scene.add(mesh);

      const imagePlane = new ImagePlane(mesh, img);
      imagePlane.setParams();

      imagePlaneArray.push(imagePlane);
    }

    loop();
  });

  // リサイズ（負荷軽減のためリサイズが完了してから発火する）
  window.addEventListener('resize', () => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = window.setTimeout(resize, 200);
  });

};

main();
