import * as THREE from 'three';
export declare class TextSprite {
    text: string;
    fontSize: number;
    color: any;
    position: THREE.Vector3;
    obj: THREE.Sprite;
    constructor(parameter: any);
    makeTextSprite(): THREE.Sprite;
}
