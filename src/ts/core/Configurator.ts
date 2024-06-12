import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

let flag: String;
let camera, scene, renderer, controls, container;
let width, height;

export const initConfigurator = (model) => {
    if (flag !== model) {
        flag = model;

        // Remove Element and Canvas
        let configuratorContainer = document.getElementById('configuratorContainer');
        let configuratorElement = document.getElementById('configurator');
        if (configuratorElement) {
            configuratorContainer.removeChild(configuratorElement);
        }
        let configuratorAgain = document.createElement('div');
        configuratorAgain.id = 'configurator';
        configuratorContainer.appendChild(configuratorAgain);

        configuratorContainer.style.display = 'flex';

	    init(model);
        animate();
    }
}

function init(modelFormat: string) {
    container = document.getElementById('configurator');
    width = container.clientWidth;
    height = container.clientHeight;
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
    camera.position.set( 0, 0, 2 );

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( width / height );
    renderer.setSize( width, height );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild( renderer.domElement );

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    const hdriLoader = new RGBELoader()
    hdriLoader.load( 'build/assets/hdr/env.hdr', function ( texture ) {
        const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
        texture.dispose();
        scene.environment = envMap;

        const loader = new GLTFLoader().setPath( 'build/assets/' );
        let url = (modelFormat === 'character')? 'boxman.glb':'car.glb';
        loader.load( url, async function ( gltf ) {
            const model = gltf.scene;
            model.position.y -= 0.5
            scene.add( model );
        } );
    } );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.target.set( 0, 0, - 0.2 );
    controls.update();

    // Lights
    const ambientLight = new THREE.AmbientLight( 0x404040, 0.2 ); // soft white light
    scene.add( ambientLight );

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
    render();
}

function animate() {
    container = document.getElementById('configurator');
    if (container) {
        requestAnimationFrame(animate)
        if (controls) controls.update()
        render();
    }
}

function render() {
    renderer.render( scene, camera );
}


