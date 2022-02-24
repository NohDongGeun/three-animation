import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader';

let container, camera, controls, scene, renderer;
let mixer;
let clock;
let animations = new Map();
let aniModel, clothModel;
let selectedAniName = null;
let isLoading = true;

window.LolozemMojaViewer = {};

const DEFAULT_DRACO_DECODER_LOCATION = 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/';
const initializeCharacterSize = 400;

const ANIMATION_GLB_FILE_PATH = 'models/girl_ani.glb';
const CLOTH_GLB_FILE_PATH = 'models/cloth.glb';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DEFAULT_DRACO_DECODER_LOCATION);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const gui = new GUI();

const GuiOptions = function (firstAnimation) {
    this.animation = firstAnimation;
    this.characterScale = initializeCharacterSize;
}

let guiOptions;

const init = async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0,500, 1000);

    controls = new OrbitControls(camera, container);
    controls.target.set( 0, 300, 0);
    controls.update();

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    const grid = new THREE.GridHelper( 10000,  50, 0xffffff, 0xffffff );
    scene.add(grid);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener('beforeunload', onRemoveWindowResize, false);

    isLoading = false;

    await loadAllModels();

    animate();
}

const loadModel = (url) => {
    return new Promise(resolve => {
        new GLTFLoader().load(url, resolve);
    })
}

const loadAllModels = () => {
    Promise.all([
        loadModel(ANIMATION_GLB_FILE_PATH),
        loadModel(CLOTH_GLB_FILE_PATH)
    ])
        .then(([aniGlb, clothGlb]) => {
            aniModel = aniGlb.scene;
            clothModel = clothGlb.scene;

            const sharedSkeleton = aniModel.children[0].children[1].skeleton;

            clothModel.children[0].children &&
                clothModel.children[0].children.map(item => item.skeleton = sharedSkeleton);

            mixer = new THREE.AnimationMixer(aniModel);

            aniGlb.animations.forEach((clip, index) => {
                if (index === 0) {
                    guiOptions = new GuiOptions(clip.name);

                    !window.LolozemMojaAPI && mixer.clipAction(clip).play();

                    selectedAniName = clip.name;
                }

                animations.set(clip.name, clip);
            })


            scene.add(aniModel);
            scene.add(clothModel);

            aniModel.scale.set(initializeCharacterSize, initializeCharacterSize, initializeCharacterSize);

            guiSetup();
        })
        .catch((error) => console.log(error));
}

const onChangeAnimationName = (animName) => {
    mixer.clipAction(animations.get(selectedAniName)).stop();
    mixer.clipAction(animations.get(animName)).play();
    selectedAniName = animName;
}

const onPlayAnimation = () => {
    if (isLoading) return;

    if (mixer && selectedAniName && animations) {
        const clipAction = mixer.clipAction(animations.get(selectedAniName));
        if (!clipAction.isRunning()) {
            clipAction.paused = false;
            clipAction.play();
        }
    }
}

const onPauseAnimation = () => {
    if (mixer && selectedAniName && animations && !isLoading ) {
        const clipAction = mixer.clipAction(animations.get(selectedAniName));

        if (clipAction.isRunning()) {
            clipAction.paused = true;
        }
    }
}

const onStopAnimation = () => {
    if (mixer || !isLoading || animations || selectedAniName) {
        mixer.clipAction(animations.get(selectedAniName)).stop();
    }
}

const guiSetup = () => {
    const animationControl = gui.add(guiOptions, 'animation', [...animations.keys()]);
    const characterScaleControl = gui.add(guiOptions, 'characterScale').min(100).max(1000).step(1);

    animationControl.onChange((animationName) => {
        mixer.clipAction(animations.get(selectedAniName)).stop();
        mixer.clipAction(animations.get(animationName)).play();
        selectedAniName = animationName;
    })

    characterScaleControl.onChange((scale) => {
        if (scale > 0) {
            aniModel.scale.set(scale, scale, scale)
        }
    })
};

const onRemoveWindowResize = () => {
    window.removeEventListener('resize', onWindowResize);
}

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const animate = () => {
    if (mixer !== undefined) {
        mixer.update(clock.getDelta());
    }

    requestAnimationFrame(animate);

    renderer.render(scene, camera);
};

await init();