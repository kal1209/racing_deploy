import * as THREE from 'three';
import * as CANNON from 'cannon';
import Swal from 'sweetalert2';
import * as $ from 'jquery';

import { CameraOperator } from '../core/CameraOperator';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

import { Detector } from '../../lib/utils/Detector';
import { Stats } from '../../lib/utils/Stats';
import * as GUI from '../../lib/utils/dat.gui';
import { CannonDebugRenderer } from '../../lib/cannon/CannonDebugRenderer';
import * as _ from 'lodash';

import { InputManager } from '../core/InputManager';
import * as Utils from '../core/FunctionLibrary';
import { LoadingManager } from '../core/LoadingManager';
import { InfoStack } from '../core/InfoStack';
import { UIManager } from '../core/UIManager';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { IUpdatable } from '../interfaces/IUpdatable';
import { IDetector } from '../interfaces/IDetector';
import { Character } from '../characters/Character';
import { Path } from './Path';
import { CollisionGroups } from '../enums/CollisionGroups';
import { BoxCollider } from '../physics/colliders/BoxCollider';
import { TrimeshCollider } from '../physics/colliders/TrimeshCollider';
import { Vehicle } from '../vehicles/Vehicle';
import { Scenario } from './Scenario';
import { Sky } from './Sky';
import { Ocean } from './Ocean';
import { MyCharacter } from './Player/Player';
import {
	InitSocket,
	ReceiveMySid,
	ReportJoin,
} from '../socket/socket';
import { Result } from './Result';
import { OutTrack } from './OutTrack';
import { IBubble } from '../interfaces/IBubble';

export let realtimeDetect = true;
export let enableVehicleUpdate = true;
export let enableCharacterUpdate = true;
export class World {
	public renderer: THREE.WebGLRenderer;
	public camera: THREE.PerspectiveCamera;
	public composer: any;
	public stats: Stats;
	public graphicsWorld: THREE.Scene;
	public sky: Sky;
	public physicsWorld: CANNON.World;
	public parallelPairs: any[];
	public physicsFrameRate: number;
	public physicsFrameTime: number;
	public physicsMaxPrediction: number;
	public clock: THREE.Clock;
	public renderDelta: number;
	public logicDelta: number;
	public requestDelta: number;
	public sinceLastFrame: number;
	public justRendered: boolean;
	public inputManager: InputManager;
	public cameraOperator: CameraOperator;
	public timeScaleTarget: number = 1;
	public console: InfoStack;
	public cannonDebugRenderer: CannonDebugRenderer;
	public scenarios: Scenario[] = [];
	public characters: Character[] = [];
	public vehicles: Vehicle[] = [];
	public paths: Path[] = [];
	public scenarioGUIFolder: any;
	public updatables: IUpdatable[] = [];
	public mode: String;
	public mySid: String;
	public static myName: String;
	public players: MyCharacter[] = [];
	public boxmanKey: any;
	public carKey: any;
	public heliKey: any;
	public airplaneKey: any;
	public detectLines: any[] = [];
	public detectables: IDetector[] = [];
	public bubbles: IBubble[] = [];
	public static gameRounds: number = 1;
	public static envMap: any;
	public static enablePressButton: boolean = false;
	public static roomId: String;
	public static params: any;
	private envMapFlag: boolean = true;

	private lastScenarioID: string;

	constructor(worldScenePath?: any, boxmanKey: any = undefined, carKey: any = undefined, heliKey: any = undefined, airplaneKey: any = undefined) {
		InitSocket(this);
		const scope = this;
		this.boxmanKey = boxmanKey;
		this.carKey = carKey;
		this.heliKey = heliKey;
		this.airplaneKey = airplaneKey;

		// WebGL not supported
		if (!Detector.webgl) {
			Swal.fire({
				icon: 'warning',
				title: 'WebGL compatibility',
				text: 'This browser doesn\'t seem to have the required WebGL capabilities. The application may not work correctly.',
				footer: '<a href="https://get.webgl.org/" target="_blank">Click here for more information</a>',
				showConfirmButton: false,
				buttonsStyling: false
			});
		}

		// Renderer
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.0;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.generateHTML();

		// Auto window resize
		function onWindowResize(): void {
			scope.camera.aspect = window.innerWidth / window.innerHeight;
			scope.camera.updateProjectionMatrix();
			scope.renderer.setSize(window.innerWidth, window.innerHeight);
			fxaaPass.uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio));
			scope.composer.setSize(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
		}
		window.addEventListener('resize', onWindowResize, false);

		// Three.js scene
		this.graphicsWorld = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1010);

		// Passes
		let renderPass = new RenderPass(this.graphicsWorld, this.camera);
		let fxaaPass = new ShaderPass(FXAAShader);

		// FXAA
		let pixelRatio = this.renderer.getPixelRatio();
		fxaaPass.material['uniforms'].resolution.value.x = 1 / (window.innerWidth * pixelRatio);
		fxaaPass.material['uniforms'].resolution.value.y = 1 / (window.innerHeight * pixelRatio);

		// Composer
		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(renderPass);
		this.composer.addPass(fxaaPass);

		// Physics
		this.physicsWorld = new CANNON.World();
		this.physicsWorld.gravity.set(0, -9.81, 0);
		this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
		this.physicsWorld.solver.iterations = 10;
		this.physicsWorld.allowSleep = true;

		this.parallelPairs = [];
		this.physicsFrameRate = 60;
		this.physicsFrameTime = 1 / this.physicsFrameRate;
		this.physicsMaxPrediction = this.physicsFrameRate;

		// RenderLoop
		this.clock = new THREE.Clock();
		this.renderDelta = 0;
		this.logicDelta = 0;
		this.sinceLastFrame = 0;
		this.justRendered = false;

		// Stats (FPS, Frame time, Memory)
		this.stats = Stats();

		// Create right panel GUI
		this.setParamsGUI(scope);
		// this.createParamsGUI(scope);

		// Initialization
		this.cameraOperator = new CameraOperator(this, this.camera, World.params.Mouse_Sensitivity);
		this.sky = new Sky(this);

		// Load scene if path is supplied
		if (worldScenePath !== undefined) {
			let userData = this.getMyUserData();
			let player = new MyCharacter(userData);
			this.players.push(player);
			ReceiveMySid(this.players[0]);

			let loadingManager = new LoadingManager(this);
			loadingManager.onFinishedCallback = () => {
				this.update(1, 1);
				this.setTimeScale(1);
				UIManager.setUserInterfaceVisible(true);
				// Swal.fire({
				// 	title: 'Welcome to Sketchbook!',
				// 	text: 'Feel free to explore the world and interact with available vehicles. There are also various scenarios ready to launch from the right panel.',
				// 	footer: '<a href="https://github.com/swift502/Sketchbook" target="_blank">GitHub page</a><a href="https://discord.gg/fGuEqCe" target="_blank">Discord server</a>',
				// 	confirmButtonText: 'Okay',
				// 	buttonsStyling: false,
				// 	onClose: () => {
				// 		UIManager.setUserInterfaceVisible(true);
				// 		UIManager.addButtonToContainer('ui-container',"Play", () => {
				// 			console.log('Button clicked!')});
				// 	}
				// });
			};
			loadingManager.loadGLTF(worldScenePath, (gltf) => {
				this.loadScene(loadingManager, gltf);
			}
			);
		}
		else {
			UIManager.setUserInterfaceVisible(true);
			UIManager.setLoadingScreenVisible(false);
			Swal.fire({
				icon: 'success',
				title: 'Hello world!',
				text: 'Empty Sketchbook world was succesfully initialized. Enjoy the blueness of the sky.',
				buttonsStyling: false
			});
		}

		// Input initialization
		this.inputManager = new InputManager(this, this.renderer.domElement);

		// env map for scene
		const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		const hdriLoader = new RGBELoader()
		hdriLoader.load('build/assets/hdr/env.hdr', function (texture) {
			const envMap = pmremGenerator.fromEquirectangular(texture).texture;
			texture.dispose();
			World.envMap = envMap;
		});

		// Render
		this.render(this);
	}

	// Get My UserData
	public getMyUserData(): Object {
		// name
		let name = "Player" + Math.ceil(Math.random() * 100);

		// Color
		let rValue = Math.floor(Math.random() * 255);
		let gValue = Math.floor(Math.random() * 255);
		let bValue = Math.floor(Math.random() * 255);

		return {
			name: name,
			color: { r: rValue, g: gValue, b: bValue }
		}
	}

	// Update
	public update(timeStep: number, unscaledTimeStep: number): void {
		this.updatePhysics(timeStep);

		// Update registred objects
		this.updatables.forEach((entity) => {
			entity.update(timeStep, unscaledTimeStep);
		});

		this.detectables.forEach((entity) => {
			entity.update(timeStep, unscaledTimeStep);
		})

		this.bubbles.forEach((entity) => {
			entity.update(timeStep, unscaledTimeStep);
		})

		// Lerp time scale
		World.params.Time_Scale = THREE.MathUtils.lerp(World.params.Time_Scale, this.timeScaleTarget, 0.2);

		// Physics debug
		if (World.params.Debug_Physics) this.cannonDebugRenderer.update();

		// set EnvMap
		if (this.envMapFlag) {
			if (World.envMap !== undefined) {
				this.graphicsWorld.environment = World.envMap;
				this.envMapFlag = false;
			}
		}
	}

	public updatePhysics(timeStep: number): void {
		// Step the physics world
		this.physicsWorld.step(this.physicsFrameTime, timeStep);

		this.characters.forEach((char) => {
			if (this.isOutOfBounds(char.characterCapsule.body.position)) {
				this.outOfBoundsRespawn(char.characterCapsule.body);
			}
		});

		this.vehicles.forEach((vehicle) => {
			if (this.isOutOfBounds(vehicle.rayCastVehicle.chassisBody.position)) {
				let worldPos = new THREE.Vector3();
				vehicle.spawnPoint.getWorldPosition(worldPos);
				worldPos.y += 1;
				this.outOfBoundsRespawn(vehicle.rayCastVehicle.chassisBody, Utils.cannonVector(worldPos));
			}
		});
	}

	public isOutOfBounds(position: CANNON.Vec3): boolean {
		let inside = position.x > -211.882 && position.x < 211.882 &&
			position.z > -169.098 && position.z < 153.232 &&
			position.y > 0.107;
		let belowSeaLevel = position.y < 14.989;

		return !inside && belowSeaLevel;
	}

	public outOfBoundsRespawn(body: CANNON.Body, position?: CANNON.Vec3): void {
		let newPos = position || new CANNON.Vec3(0, 16, 0);
		let newQuat = new CANNON.Quaternion(0, 0, 0, 1);

		body.position.copy(newPos);
		body.interpolatedPosition.copy(newPos);
		body.quaternion.copy(newQuat);
		body.interpolatedQuaternion.copy(newQuat);
		body.velocity.setZero();
		body.angularVelocity.setZero();
	}

	/**
	 * Rendering loop.
	 * Implements fps limiter and frame-skipping
	 * Calls world's "update" function before rendering.
	 * @param {World} world 
	 */
	public render(world: World): void {
		this.requestDelta = this.clock.getDelta();

		requestAnimationFrame(() => {
			world.render(world);
		});

		// Getting timeStep
		let unscaledTimeStep = (this.requestDelta + this.renderDelta + this.logicDelta);
		let timeStep = unscaledTimeStep * World.params.Time_Scale;
		timeStep = Math.min(timeStep, 1 / 30);    // min 30 fps

		// Logic
		world.update(timeStep, unscaledTimeStep);

		// Measuring logic time
		this.logicDelta = this.clock.getDelta();

		// Frame limiting
		let interval = 1 / 60;
		this.sinceLastFrame += this.requestDelta + this.renderDelta + this.logicDelta;
		this.sinceLastFrame %= interval;

		// Stats end
		this.stats.end();
		this.stats.begin();

		// Actual rendering with a FXAA ON/OFF switch
		if (World.params.FXAA) this.composer.render();
		else this.renderer.render(this.graphicsWorld, this.camera);

		// Measuring render time
		this.renderDelta = this.clock.getDelta();
	}

	public setTimeScale(value: number): void {
		World.params.Time_Scale = value;
		this.timeScaleTarget = value;
	}

	public add(worldEntity: IWorldEntity): void {
		worldEntity.addToWorld(this);
		this.registerUpdatable(worldEntity);
	}

	public registerUpdatable(registree: IUpdatable): void {
		this.updatables.push(registree);
		this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder) ? 1 : -1);
	}

	public remove(worldEntity: IWorldEntity): void {
		worldEntity.removeFromWorld(this);
		this.unregisterUpdatable(worldEntity);
	}

	public unregisterUpdatable(registree: IUpdatable): void {
		_.pull(this.updatables, registree);
	}

	public registerDetectable(registree: IDetector): void {
		this.detectables.push(registree);
	}

	public registerBubbles(bubble: IBubble): void {
		this.bubbles.push(bubble);
	}

	public unregisterBubbles(bubble: IBubble): void {
		_.pull(this.bubbles, bubble);
	}

	public loadScene(loadingManager: LoadingManager, gltf: any): void {
		gltf.scene.traverse((child) => {
			if (child.hasOwnProperty('userData')) {
				if (child.type === 'Mesh') {
					Utils.setupMeshProperties(child);
					this.sky.csm.setupMaterial(child.material);

					if (child.material.name === 'ocean') {
						this.registerUpdatable(new Ocean(child, this));
					}

				}

				if (child.userData.hasOwnProperty('data')) {
					if (child.userData.data === 'physics') {
						if (child.userData.hasOwnProperty('type')) {
							// Convex doesn't work! Stick to boxes!
							if (child.userData.type === 'box') {
								let phys = new BoxCollider({ size: new THREE.Vector3(child.scale.x, child.scale.y, child.scale.z) });
								phys.body.position.copy(Utils.cannonVector(child.position));
								phys.body.quaternion.copy(Utils.cannonQuat(child.quaternion));
								phys.body.computeAABB();

								phys.body.shapes.forEach((shape) => {
									shape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
								});

								this.physicsWorld.addBody(phys.body);
							}
							else if (child.userData.type === 'trimesh') {
								let phys = new TrimeshCollider(child, {});
								this.physicsWorld.addBody(phys.body);
							}

							child.visible = false;
						}
					}

					if (child.userData.data === 'path') {
						this.paths.push(new Path(child));
					}

					if (child.userData.data === 'scenario') {
						this.scenarios.push(new Scenario(child, this));
					}
				}
			}
			if (child.name === 'disable') {
				child.material.visible = false;
				this.registerDetectable(new OutTrack(child, this));
			}
			if (child.name.includes('resultLine') || child.name.includes('roundLine')) {
				this.detectLines.push(child);
			}
		});

		this.registerDetectable(new Result(this.detectLines, this));

		this.graphicsWorld.add(gltf.scene);

		let defaultScenarioID: string;
		for (const scenario of this.scenarios) {
			if (!scenario.default && scenario.id === 'hub') {
				defaultScenarioID = scenario.id;
				break;
			}
		}

		if (defaultScenarioID !== undefined) {
			this.mode = 'hub';
			this.players[0].scenario = defaultScenarioID;
			this.launchScenario(defaultScenarioID, loadingManager);
		}
	}

	public launchScenario(scenarioID: string, loadingManager?: LoadingManager): void {
		this.lastScenarioID = scenarioID;

		this.clearEntities();

		// Launch default scenario
		if (!loadingManager) loadingManager = new LoadingManager(this);
		for (const scenario of this.scenarios) {
			if (scenario.id === scenarioID || scenario.spawnAlways) {
				scenario.launch(loadingManager, this, this.players);
			}
		}
	}

	public restartScenario(): void {
		if (this.lastScenarioID !== undefined) {
			document.exitPointerLock();
			this.launchScenario(this.lastScenarioID);
		}
		else {
			console.warn('Can\'t restart scenario. Last scenarioID is undefined.');
		}
	}

	public clearEntities(): void {
		for (let i = 0; i < this.characters.length; i++) {
			this.remove(this.characters[i]);
			i--;
		}

		for (let i = 0; i < this.vehicles.length; i++) {
			this.remove(this.vehicles[i]);
			i--;
		}
	}

	public scrollTheTimeScale(scrollAmount: number): void {
		// Changing time scale with scroll wheel
		const timeScaleBottomLimit = 0.003;
		const timeScaleChangeSpeed = 1.3;

		if (scrollAmount > 0) {
			this.timeScaleTarget /= timeScaleChangeSpeed;
			if (this.timeScaleTarget < timeScaleBottomLimit) this.timeScaleTarget = 0;
		}
		else {
			this.timeScaleTarget *= timeScaleChangeSpeed;
			if (this.timeScaleTarget < timeScaleBottomLimit) this.timeScaleTarget = timeScaleBottomLimit;
			this.timeScaleTarget = Math.min(this.timeScaleTarget, 1);
		}
	}

	public updateControls(controls: any): void {
		let html = '';
		html += '<h2 class="controls-title">Controls:</h2>';

		controls.forEach((row) => {
			html += '<div class="ctrl-row">';
			row.keys.forEach((key) => {
				if (key === '+' || key === 'and' || key === 'or' || key === '&') html += '&nbsp;' + key + '&nbsp;';
				else html += '<span class="ctrl-key">' + key + '</span>';
			});

			html += '<span class="ctrl-desc">' + row.desc + '</span></div>';
		});

		document.getElementById('controls').innerHTML = html;
	}

	public changeEnableCharacter(value: any) {
		enableCharacterUpdate = value;
	}

	public changeEnableVehicle(value: any) {
		enableVehicleUpdate = value;
	}

	private generateHTML(): void {
		// Fonts
		$('head').append('<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap" rel="stylesheet">');
		$('head').append('<link href="https://fonts.googleapis.com/css2?family=Solway:wght@400;500;700&display=swap" rel="stylesheet">');
		$('head').append('<link href="https://fonts.googleapis.com/css2?family=Cutive+Mono&display=swap" rel="stylesheet">');

		// Loader
		$(`	<div id="loading-screen">
				<div id="loading-screen-background"></div>
				<h1 id="main-title" class="sb-font">Token Racer 1.0</h1>
				<div class="cubeWrap">
					<div class="cube">
						<div class="faces1"></div>
						<div class="faces2"></div>     
					</div> 
				</div> 
				<div id="loading-text">Loading...</div>
			</div>
		`).appendTo('body');

		// UI
		$(`	<div id="ui-container" style="display: none;">
				<div class="left-panel">
					<div id="controls" class="panel-segment flex-bottom"></div>
				</div>
			</div>
		`).appendTo('body');

		// Canvas
		document.body.appendChild(this.renderer.domElement);
		this.renderer.domElement.id = 'canvas';
	}

	private setParamsGUI(scope: World): void {
		World.params = {
			Pointer_Lock: true,
			Mouse_Sensitivity: 0.3,
			Time_Scale: 1,
			Shadows: true,
			FXAA: true,
			Debug_Physics: false,
			Debug_FPS: false,
			Sun_Elevation: 50,
			Sun_Rotation: 145,
			realtimeDetect: realtimeDetect,
		};
	}

	private createParamsGUI(scope: World): void {
		const gui = new GUI.GUI();

		//Scenario
		this.scenarioGUIFolder = gui.addFolder('Scenarios');
		this.scenarioGUIFolder.open();

		//World
		let worldFolder = gui.addFolder('World');
		worldFolder.add(World.params, 'Time_Scale', 0, 1).listen()
			.onChange((value) => {
				scope.timeScaleTarget = value;
			});
		worldFolder.add(World.params, 'Sun_Elevation', 0, 180).listen()
			.onChange((value) => {
				scope.sky.phi = value;
			});
		worldFolder.add(World.params, 'Sun_Rotation', 0, 360).listen()
			.onChange((value) => {
				scope.sky.theta = value;
			});

		// Input
		let settingsFolder = gui.addFolder('Settings');
		settingsFolder.add(World.params, 'FXAA');
		settingsFolder.add(World.params, 'Shadows')
			.onChange((enabled) => {
				if (enabled) {
					this.sky.csm.lights.forEach((light) => {
						light.castShadow = true;
					});
				}
				else {
					this.sky.csm.lights.forEach((light) => {
						light.castShadow = false;
					});
				}
			});
		settingsFolder.add(World.params, 'Pointer_Lock')
			.onChange((enabled) => {
				scope.inputManager.setPointerLock(enabled);
			});
		settingsFolder.add(World.params, 'Mouse_Sensitivity', 0, 1)
			.onChange((value) => {
				scope.cameraOperator.setSensitivity(value, value * 0.8);
			});
		settingsFolder.add(World.params, 'Debug_Physics')
			.onChange((enabled) => {
				if (enabled) {
					this.cannonDebugRenderer = new CannonDebugRenderer(this.graphicsWorld, this.physicsWorld);
				}
				else {
					this.cannonDebugRenderer.clearMeshes();
					this.cannonDebugRenderer = undefined;
				}

				scope.characters.forEach((char) => {
					char.raycastBox.visible = enabled;
				});
			});
		settingsFolder.add(World.params, 'Debug_FPS')
			.onChange((enabled) => {
				UIManager.setFPSVisible(enabled);
			});
		settingsFolder.add(World.params, 'realtimeDetect')
			.onChange((enabled) => {
				realtimeDetect = enabled;
			})

		gui.open();
	}
}