import * as THREE from 'three';
import { IDetector } from '../interfaces/IDetector';
import { World } from './World';
import { FinishRace } from '../socket/socket';

export class Result implements IDetector
{
    public resultLine: THREE.Vector3[] = [];
    public roundLine: THREE.Vector3[] = [];
    public resultCollider: any;
    public roundCollider: any;
    public world: World;
    public static gameOver: boolean = false;
    public roundOver: number = 1;
    public static section: number = 1;

    private resultFlag: boolean = false;
    private roundFlag: boolean = false;

    constructor (objects: any[], world: World) {
        this.world = world;
        this.getResultLine(objects);
        this.getRoundLine(objects);
        this.resultCollider = this.getColliderData(this.resultLine);
        this.roundCollider = this.getColliderData(this.roundLine);
    }

    public getResultLine(objects: any[]): void {
        objects.forEach((object) => {
            if (object.name.includes('resultLine')) {
                let worldPos = new THREE.Vector3();
                object.getWorldPosition(worldPos);
                this.resultLine.push(worldPos);
            }
        })
    }

    public getRoundLine(objects: any[]): void {
        objects.forEach((object) => {
            if (object.name.includes('roundLine')) {
                let worldPos = new THREE.Vector3();
                object.getWorldPosition(worldPos);
                this.roundLine.push(worldPos);
            }
        })
    }

    public getColliderData (lines: THREE.Vector3[]): any 
    {
        // Game result logic
        if (lines.length !== 0) {
            let colliderWidth = 5;
            let colliderheight = Math.abs(lines[0].z - lines[1].z);
            let colliderDepth = 5;
            let posZ;
            posZ = Math.abs(lines[0].z - lines[1].z) / 2 + ((lines[0].z >= lines[1].z)?lines[1].z: lines[0].z);

            let resColliderPosition = new THREE.Vector3(lines[0].x, (lines[0].y >= lines[1].y)?lines[0].y: lines[1].y, posZ);

            const cube_ = new THREE.Mesh(
                new THREE.BoxGeometry(colliderWidth, colliderDepth, colliderheight),
            );
            cube_.position.copy(resColliderPosition);
            let cube1BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3);
            cube1BB.setFromObject(cube_);
            
            return cube1BB;
        } else return null;
    }

    public createVehicleCollider (pos: THREE.Vector3): any 
    {
        const cube = new THREE.Mesh(
			new THREE.BoxGeometry(2,2,2),
		);
		cube.position.set(pos.x, pos.y, pos.z);
        let cube2BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3);
        cube2BB.setFromObject(cube);

        return cube2BB;
    }

    public update(timeStep: number): void
	{
        let player = this.world.players[0];

        if (player.character && player.character.controlledObject && this.world.mode !== 'hub') {
            let vehicle = player.character.controlledObject;
            let vehicleCollider = this.createVehicleCollider(vehicle.position);

            if(vehicleCollider.intersectsBox(this.resultCollider)) // Detect result collider
            {   
                this.resultFlag = true;
                if (this.roundOver > World.gameRounds) {
                    if(!Result.gameOver){
                        console.log("I have finished game");
                        FinishRace(Result.section);
                        player.character.controlledObject.triggerAction('brake', true);
                        Result.gameOver = true;
                    }
                }
            }

            if(vehicleCollider.intersectsBox(this.roundCollider)) // detect round collider
            {
                if (this.resultFlag) {
                    console.log("Next round");
                    let currentRound = document.getElementById('current-round');
                    this.roundOver++;
                    let currentRoundValue = this.roundOver - 1;
                    currentRound.innerHTML = 'Rounds: ' + currentRoundValue + '/' + World.gameRounds;
                    this.resultFlag = false;
                }
            }
        }
    }
}