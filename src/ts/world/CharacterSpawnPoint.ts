import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import * as THREE from 'three';
import { World } from './World';
import { Character } from '../characters/Character';
import { LoadingManager } from '../core/LoadingManager';
import * as Utils from '../core/FunctionLibrary';
import { MyCharacter } from './Player/Player';
import { changeStatus, updateCharacters } from '../socket/socket';
import { enableCharacterUpdate, realtimeDetect } from './World';

export class CharacterSpawnPoint implements ISpawnPoint
{
	private object: THREE.Object3D;
	public driver: string = "character";

	constructor(object: THREE.Object3D)
	{
		this.object = object;
	}
	
	public spawn(loadingManager: LoadingManager, world: World, players: MyCharacter[], userData: any, playerIndex: number): void
	{	
		let boxmanLink = (world.boxmanKey.length !== 0)?"https://dl.dropboxusercontent.com/scl/fi/" + world.boxmanKey[0] + "/boxman.glb?rlkey=" + world.boxmanKey[1] + "&dl=1":"build/assets/boxman.glb";
		loadingManager.loadGLTF(boxmanLink, (model) =>
		{	
			let xPos = (userData.playerIndex - 1) * 5;
			let yPos = this.object.position.y + (userData.playerIndex - 1) * (-0.3) ;
			let zPos = 0;

			this.object.position.x = xPos;
			this.object.position.y = yPos
			this.object.position.z = zPos;
			this.object.rotation.y = Math.PI;

			model.scene.traverse((obj) => {
				if (obj.isMesh) {
					obj.receiveShadow = true;
					obj.castShadow = true;
				}
			})

			let player = new Character(model);

			if (userData.mySid) player.sid = userData.mySid;

			let worldPos = new THREE.Vector3();
			this.object.getWorldPosition(worldPos);
			player.setPosition(worldPos.x, worldPos.y, worldPos.z);
			
			let forward = Utils.getForward(this.object);
			player.setOrientation(forward, true);

			world.add(player);

			if (userData.mySid === players[0].mySid) player.takeControl();
			if (playerIndex >= 0) players[playerIndex].character = player;
			if (enableCharacterUpdate && realtimeDetect) {
				changeStatus('foot');
				updateCharacters(world);
			} 
		});
	}
}