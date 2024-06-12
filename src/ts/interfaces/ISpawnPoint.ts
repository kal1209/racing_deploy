import { World } from '../world/World';
import { LoadingManager } from '../core/LoadingManager';
import { MyCharacter } from '../world/Player/Player';

export interface ISpawnPoint
{	
	driver: string;
	spawn(loadingManager: LoadingManager, world: World, players: MyCharacter[], userData: any, playerIndex: number): void;
}