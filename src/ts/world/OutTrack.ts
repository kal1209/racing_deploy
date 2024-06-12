import * as THREE from "three";
import { IDetector } from "../interfaces/IDetector";
import * as Utils from '../core/FunctionLibrary';
import * as CANNON from 'cannon';
import { World } from "./World";

const avialbeTime = 3;

export class OutTrack implements IDetector {
    public object: any;
    public world: World;
    public timeRemaining: number = avialbeTime;
    public status: string = 'in';
    public originalPosition: THREE.Vector3 = new THREE.Vector3();
    private setTimeFlag = true;
    private outTime: any;
    private tValue: any;

    constructor (object: any, world: World) {
        this.object = object;
        this.world = world;
    }

    private detectOutTrack(timeStep: number): void {
        // Check ride vehicle
        if (this.world.players[0] && this.world.players[0].character && this.world.players[0].character.controlledObject) {
            let vehicle = this.world.players[0].character.controlledObject;

            const raycaster = new THREE.Raycaster();
            raycaster.set(
                vehicle.position,
                new THREE.Vector3(0, -1, 0)
            );

            const intersects = raycaster.intersectObject(this.object);

            if (intersects.length > 0) {
                this.status = 'out';
                if (this.setTimeFlag) {
                    this.outTime = performance.now();
                    this.setTimeFlag = false;
                    this.originalPosition.copy(vehicle.position);
                }
            }
            else {
                this.status = 'in';
                this.setTimeFlag = true;
                this.timeRemaining = avialbeTime;

                let discountTimer = document.getElementById('discount-timer');
                discountTimer.style.display = 'none';

                let discountElement = document.getElementById('discount');
                discountElement.innerHTML = '';
            }
        }
    }

    private moveVehicleOrigin(timeStep: number): void {
        if (this.status === 'out') {
            let currentTime = performance.now();
            let period = Math.floor((currentTime - this.outTime) / 1000);
            if (this.tValue !== period) {
                this.timeRemaining -= 1;

                // Discount time
                if ((this.timeRemaining >= 1) && (this.timeRemaining < 3)) {
                    let discountTimer = document.getElementById('discount-timer');
                    discountTimer.style.display = 'flex';

                    let discountElement = document.getElementById('discount');
                    discountElement.innerHTML = this.timeRemaining + '';
                } else {
                    let discountTimer = document.getElementById('discount-timer');
                    discountTimer.style.display = 'none';

                    let discountElement = document.getElementById('discount');
                    discountElement.innerHTML = '';
                }

                if (this.timeRemaining === 0) {
                    let vehicle = this.world.players[0].character.controlledObject;
                    if (vehicle) {
                        let body = vehicle.rayCastVehicle.chassisBody;
                        let position = Utils.cannonVector(new THREE.Vector3(this.originalPosition.x, this.originalPosition.y + 1, this.originalPosition.z));
                        body.position.copy(position);
                        body.interpolatedPosition.copy(position);
                        body.velocity.setZero();
                        body.angularVelocity.setZero();
                        this.timeRemaining = avialbeTime;
                    }
                }
                this.tValue = period;
            }
        }
    }

    public update(timeStep: number): void
	{
        if (this.world.mode !== 'hub') {
            this.detectOutTrack(timeStep);
            this.moveVehicleOrigin(timeStep);
        }
    }
}