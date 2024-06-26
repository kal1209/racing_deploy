import { LoadingManager } from '../core/LoadingManager';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from '../sketchbook';
import { MyCharacter } from '../world/Player/Player';
export declare const socket: import("socket.io-client").Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap>;
export declare let mySid: any;
export declare const timeStamp = 200;
export declare let playersList_: any;
export declare const InitSocket: (world: World) => void;
export declare const createRoom: (roomId: any, price: any) => void;
export declare const joinRoom: (roomInfo: any) => void;
export declare const startMultiPlayerRacing: () => void;
export declare const setUserName: () => void;
export declare const StartTimer: () => void;
export declare const SetReady: () => void;
export declare const SetNotReady: () => void;
export declare const FinishRace: (position: Number) => void;
export declare const ReceiveMySid: (OneCharacter: MyCharacter) => void;
export declare const ReportJoin: (world: World) => void;
export declare const createModels: (world: World, scenarioId: string, loadingManager: LoadingManager, sp: ISpawnPoint) => void;
export declare const pressKeyboard: (event: KeyboardEvent, code: string, world: World, pressed: boolean) => void;
export declare const moveCharacters: (world: World) => void;
export declare const changeStatus: (value: string) => void;
export declare const updateCharacters: (world: World) => void;
export declare const updateVehicles: (world: World, sid: string) => void;
