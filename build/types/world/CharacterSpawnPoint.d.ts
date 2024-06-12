import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import * as THREE from 'three';
import { World } from './World';
import { LoadingManager } from '../core/LoadingManager';
import { MyCharacter } from './Player/Player';
export declare class CharacterSpawnPoint implements ISpawnPoint {
    private object;
    driver: string;
    constructor(object: THREE.Object3D);
    spawn(loadingManager: LoadingManager, world: World, players: MyCharacter[], userData: any, playerIndex: number): void;
}
