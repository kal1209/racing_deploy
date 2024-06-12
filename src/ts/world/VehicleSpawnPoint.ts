import * as THREE from 'three';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from '../world/World';
import { Helicopter } from '../vehicles/Helicopter';
import { Airplane } from '../vehicles/Airplane';
import { Car } from '../vehicles/Car';
import * as Utils from '../core/FunctionLibrary';
import { Vehicle } from '../vehicles/Vehicle';
import { Character } from '../characters/Character';
import { FollowPath } from '../characters/character_ai/FollowPath';
import { LoadingManager } from '../core/LoadingManager';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { MyCharacter } from './Player/Player';

export class VehicleSpawnPoint implements ISpawnPoint
{
	public type: string;
	public driver: string;
	public firstAINode: string;

	private object: THREE.Object3D;

	constructor(object: THREE.Object3D)
	{
		this.object = object;
	}

	public spawn(loadingManager: LoadingManager, world: World, players: MyCharacter[], userData: any): void
	{
		let vechicleLink;
		if (this.type === 'car') {
			if (world.carKey.length !== 0) vechicleLink = "https://dl.dropboxusercontent.com/scl/fi/" + world.carKey[0] + "/car.glb?rlkey=" + world.carKey[1] + "&dl=1";
			else vechicleLink = 'build/assets/' + this.type + '.glb';
		}

		if (this.type === 'heli') {
			// if (world.carKey.length !== 0) vechicleLink = '1';
			vechicleLink = 'build/assets/' + this.type + '.glb';
		}

		if (this.type === 'airplane') {
			// if (world.carKey.length !== 0) vechicleLink = '1';
			vechicleLink = 'build/assets/' + this.type + '.glb';
		}

		loadingManager.loadGLTF(vechicleLink, (model: any) =>
		{	
			// change the material of each car
			if (model) {
				model.scene.traverse((obj) => {					
					if (obj.isMesh) {
						obj.castShadow = true;
						obj.receiveShadow = true;
						if (obj.name === 'body001') { // Window glass
							let newMaterial = new THREE.MeshPhysicalMaterial({
								map: obj.material.map,
								metalness: 0.7,
								roughness: 0,
								transparent: true,
								opacity: 0.5,
								reflectivity: 1,
								clearcoat: 1,
								clearcoatRoughness: 0.5,
								side: THREE.DoubleSide,
							})
							obj.material = newMaterial;
							obj.material.needsUpdate = true;
						}
						obj.material.envMap = World.envMap;
						obj.material.needsUpdate = true;
					}
				})

				// tail lights
				const tailLightGeometry = new THREE.SphereGeometry(0.032, 32, 32);
				const tailLightMaterial = new THREE.MeshPhysicalMaterial({
					transparent: true,
					opacity: 0.5,
					color: 'rgb(50, 0, 0)',
				});
				const tailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
				tailLight.name = 'tail_light';
				const cloneTailLight = tailLight.clone();
				model.scene.add(tailLight);
				model.scene.add(cloneTailLight);
				tailLight.position.z = -1.45;
				tailLight.position.y = 0.183;
				tailLight.position.x = 0.307;
				cloneTailLight.position.z = -1.45;
				cloneTailLight.position.y = 0.183;
				cloneTailLight.position.x = -0.307;
			}

			let vehicle: Vehicle = this.getNewVehicleByType(model, this.type);
			vehicle.spawnPoint = this.object;

			let worldPos = new THREE.Vector3();
			let worldQuat = new THREE.Quaternion();
			this.object.getWorldPosition(worldPos);
			this.object.getWorldQuaternion(worldQuat);

			vehicle.setPosition(worldPos.x, worldPos.y, worldPos.z);
			vehicle.collision.quaternion.copy(Utils.cannonQuat(worldQuat));
			world.add(vehicle);
			if (this.driver !== undefined)
			{
				let boxmanLink = world.boxmanKey.length !== 0?"https://dl.dropboxusercontent.com/scl/fi/" + world.boxmanKey[0] + "/boxman.glb?rlkey=" + world.boxmanKey[1] + "&dl=1":"build/assets/boxman.glb";
				loadingManager.loadGLTF(boxmanLink, (charModel) =>
				{	
					let character = new Character(charModel);
					
					world.add(character);
					
					character.teleportToVehicle(vehicle, vehicle.seats[0]);
					if (this.driver === 'player')
					{
						character.takeControl();
					}
					else if (this.driver === 'ai')
					{
						if (this.firstAINode !== undefined)
						{
							let nodeFound = false;
							for (const pathName in world.paths) {
								if (world.paths.hasOwnProperty(pathName)) {
									const path = world.paths[pathName];
									
									for (const nodeName in path.nodes) {
										if (Object.prototype.hasOwnProperty.call(path.nodes, nodeName)) {
											const node = path.nodes[nodeName];
											
											if (node.object.name === this.firstAINode)
											{
												character.setBehaviour(new FollowPath(node, 10));
												nodeFound = true;
											}
										}
									}
								}
							}

							if (!nodeFound)
							{
								console.error('Path node ' + this.firstAINode + 'not found.');
							}
						}
					}
				});
			}
		});
	}

	private getNewVehicleByType(model: any, type: string): Vehicle
	{
		switch (type)
		{
			case 'car': return new Car(model);
			case 'heli': return new Helicopter(model);
			case 'airplane': return new Airplane(model);
		}
	}
}