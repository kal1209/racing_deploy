import * as THREE from 'three';
import { Character } from "src/ts/characters/Character";
import { Bubble } from '../Bubble/NameBubble';

export class MyCharacter
{
    public name: String;
    public position: THREE.Vector3;
    public rotation: THREE.Vector3;
    public color: Object
    public object: THREE.Object3D[];
    public mySid: String;
    public scenario: string;
    public character: Character;
    public isReady: boolean;
    public vehicleID: Number;
    public bubble: Bubble;
    public status: string = 'ready'; // ready or finish

    constructor (userData: any) {
        this.name = userData.name;
        this.color = userData.color;
        this.isReady = false;
    }

    public getPosition (): THREE.Vector3
    {
        return this.position;
    }

    public getRotation (): THREE.Vector3
    {
        return this.rotation;
    }

    public setPosition(position: THREE.Vector3): void
    {
        this.position = new THREE.Vector3().copy(position);
    }

    public setRotation(yAngle: number): void
    {
        this.rotation = new THREE.Vector3().copy(new THREE.Vector3(0, yAngle, 0));
    }
}