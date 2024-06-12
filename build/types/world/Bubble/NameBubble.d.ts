import { IBubble } from 'src/ts/interfaces/IBubble';
import { World } from '../World';
export declare class Bubble implements IBubble {
    bubble: any;
    bubbleString: String;
    worldObject: any;
    world: World;
    color: any;
    constructor(bubbleString: String, worldObject: any, world: World, color: any);
    createBubble(): void;
    update(): void;
}
