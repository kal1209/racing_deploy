import * as THREE from 'three';
import { Character } from "src/ts/characters/Character";
import { Bubble } from '../Bubble/NameBubble';
export declare class MyCharacter {
    name: String;
    position: THREE.Vector3;
    rotation: THREE.Vector3;
    color: Object;
    object: THREE.Object3D[];
    mySid: String;
    scenario: string;
    character: Character;
    isReady: boolean;
    vehicleID: Number;
    bubble: Bubble;
    status: string;
    constructor(userData: any);
    getPosition(): THREE.Vector3;
    getRotation(): THREE.Vector3;
    setPosition(position: THREE.Vector3): void;
    setRotation(yAngle: number): void;
}
