import { Character } from '../characters/Character';
import { IInputReceiver } from './IInputReceiver';
import { VehicleSeat } from '../vehicles/VehicleSeat';
import { EntityType } from '../enums/EntityType';
export interface IControllable extends IInputReceiver {
    entityType: EntityType;
    seats: VehicleSeat[];
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    controllingCharacter: Character;
    detectPosition: THREE.Vector3;
    detectQuaternion: CANNON.Quaternion;
    detectionStart: boolean;
    collision: CANNON.Body;
    rayCastVehicle: CANNON.RaycastVehicle;
    sid: string;
    modelContainer: THREE.Group;
    triggerAction(actionName: string, value: boolean): void;
    resetControls(): void;
    allowSleep(value: boolean): void;
    onInputChange(): void;
    noDirectionPressed(): boolean;
}
