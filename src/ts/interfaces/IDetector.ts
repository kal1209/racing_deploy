export interface IDetector 
{
    update(timestep: number, unscaledTimeStep: number): void;
}