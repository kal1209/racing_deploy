import * as THREE from 'three';
import { IBubble } from 'src/ts/interfaces/IBubble';
import { TextSprite } from '../../core/MakeTextSprite';
import { World } from '../World';

export class Bubble implements IBubble
{
    public bubble: any;
    public bubbleString: String;
    public worldObject: any;
    public world: World;
    public color: any;

    constructor (bubbleString: String, worldObject: any, world: World, color: any) {
        this.bubbleString = bubbleString;
        this.worldObject = worldObject;
        this.world = world;
        this.color = color;
        this.createBubble();
    }

    public createBubble () {
        let bubbleParameters = {
            text: this.bubbleString,
            fontSize: 20,
            color: this.color,
            position: new THREE.Vector3(this.worldObject.position.x, this.worldObject.position.y - 3, this.worldObject.position.z)
        }

        this.bubble = new TextSprite(bubbleParameters);
        this.world.graphicsWorld.add(this.bubble.obj);
    }

    public update () {
        if (this.bubble && this.worldObject) {
            this.bubble.obj.position.copy(new THREE.Vector3(this.worldObject.position.x, this.worldObject.position.y - 3, this.worldObject.position.z));
        }
    }
}