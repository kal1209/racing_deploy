import * as THREE from "three";
import { IDetector } from "../interfaces/IDetector";
import { World } from "./World";
export declare class OutTrack implements IDetector {
    object: any;
    world: World;
    timeRemaining: number;
    status: string;
    originalPosition: THREE.Vector3;
    private setTimeFlag;
    private outTime;
    private tValue;
    constructor(object: any, world: World);
    private detectOutTrack;
    private moveVehicleOrigin;
    update(timeStep: number): void;
}
