import * as THREE from 'three';
import { IDetector } from '../interfaces/IDetector';
import { World } from './World';
export declare class Result implements IDetector {
    resultLine: THREE.Vector3[];
    roundLine: THREE.Vector3[];
    resultCollider: any;
    roundCollider: any;
    world: World;
    static gameOver: boolean;
    roundOver: number;
    static section: number;
    private resultFlag;
    private roundFlag;
    constructor(objects: any[], world: World);
    getResultLine(objects: any[]): void;
    getRoundLine(objects: any[]): void;
    getColliderData(lines: THREE.Vector3[]): any;
    createVehicleCollider(pos: THREE.Vector3): any;
    update(timeStep: number): void;
}
